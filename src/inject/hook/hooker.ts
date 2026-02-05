import { OriginObjects } from "./originObjects";
import { createBypassToStringMethod, filterErrorStack} from "../util";

export interface TempMethodResultWrapper<T = any> {
    current: T;
}
interface MethodHookOption<T = any> {
    descriptor?: Omit<PropertyDescriptor, "set" | "get" | "value">;
    /**
     * 唯一标识 用于unhook
     */
    id?: string
    /**
     * @param args 方法参数
     * @param abortController 中断执行控制器
     * @param thisArg this指向
     * @param tempMethodResult 可修改返回值 注意这里的返回值设置仅在中断执行时生效 
     */
    beforeMethodInvoke?: (args: any[], abortController: AbortController, thisArg: any, tempMethodResult: TempMethodResultWrapper<T>) => void;
    /**
     * @param args 方法参数
     * @param tempMethodResult 可修改返回值
     * @param thisArg this指向
     */
    afterMethodInvoke?: (args: any[], tempMethodResult: TempMethodResultWrapper<T>, thisArg: any) => void;
}
interface MethodHookMapItem {
    originMethod: Function;
    option: MethodHookOption[];
}
const hookedMethodKeyMap: Map<string, MethodHookMapItem> = new Map();
export const hookSymbol = Symbol();
export class Hooker {
    static hookMethod<T = any>(parent: any, methodName: string, key: string, hookOption: MethodHookOption<T>): boolean {
        try {
            if (!parent || typeof parent[methodName] !== 'function') {
                return false;
            }
            if (hookedMethodKeyMap.has(key)) {
                const currentHookMethodItem = hookedMethodKeyMap.get(key)!;
                currentHookMethodItem.option.push(hookOption);
                hookedMethodKeyMap.set(key, currentHookMethodItem);
                return true
            }
            const originMethod: Function = hookedMethodKeyMap.has(key) ? hookedMethodKeyMap.get(key)!.originMethod : Reflect.get(parent, methodName);
            originMethod.toString = createBypassToStringMethod(methodName);
            const hookEntryProxy = new OriginObjects.Proxy(originMethod, {
                apply(_target, thisArg, args) {
                    const hookItem = hookedMethodKeyMap.get(key);
                    if (!hookItem) {
                        //没有hook
                        return originMethod.apply(thisArg, args);
                    }
                    const tempResult: TempMethodResultWrapper<T> = {
                        current: null as T
                    }
                    const abortController = new OriginObjects.AbortController();
                    for (const currentHookOption of hookItem.option) {
                        currentHookOption.beforeMethodInvoke?.(args, abortController, thisArg, tempResult);
                    }
                    if (abortController.signal.aborted) {
                        return tempResult.current ?? undefined;
                    }
                    try {
                        tempResult.current = originMethod.apply(thisArg, args);
                    } catch (error: any) {
                        if (error.stack) {
                            error.stack = filterErrorStack(error.stack);
                        }
                        throw error;
                    }
                    for (const currentHookOption of hookItem.option) {
                        currentHookOption.afterMethodInvoke?.(args, tempResult, thisArg);
                    }
                    return tempResult.current;
                },
                has(target, p) {
                    if (p === hookSymbol) {
                        return true;
                    }
                    return Reflect.has(target, p);
                },
            });
            // 下面三个属性只有第一个hook的可以生效
            const hookDefineResult = Reflect.defineProperty(parent, methodName, {
                value: hookEntryProxy,
                writable: hookOption.descriptor?.writable ?? true,
                enumerable: hookOption.descriptor?.enumerable ?? true,
                configurable: hookOption.descriptor?.configurable ?? true,
            });
            if (hookDefineResult) {
                const hookItem: MethodHookMapItem = {
                    originMethod,
                    option: [hookOption]
                }
                hookedMethodKeyMap.set(key, hookItem);
                return true;
            }
            return false;
        } catch (error) {
            console.warn("Error on hooking method:", error);
            return false;
        }
    }
    static hookAsyncMethod<T = any>(parent: any, methodName: string, key: string, hookOption: MethodHookOption<T>): boolean {
        try {
            if (!parent || typeof parent[methodName] !== 'function') {
                return false;
            }
            if (hookedMethodKeyMap.has(key)) {
                const currentHookMethodItem = hookedMethodKeyMap.get(key)!;
                currentHookMethodItem.option.push(hookOption);
                hookedMethodKeyMap.set(key, currentHookMethodItem);
                return true
            }
            const originMethod: Function = hookedMethodKeyMap.has(key) ? hookedMethodKeyMap.get(key)!.originMethod : Reflect.get(parent, methodName);
            originMethod.toString = createBypassToStringMethod(methodName);
            const hookEntry = new Proxy(originMethod, {
                apply(_target, thisArg, args) {
                    return new Promise<T>(async (resolve, reject) => {
                        const hookItem = hookedMethodKeyMap.get(key);
                        if (!hookItem) {
                            //没有hook
                            resolve(await originMethod.apply(thisArg, args))
                            return
                        }
                        const tempResult: TempMethodResultWrapper<T> = {
                            current: undefined as T
                        }
                        const abortController = new AbortController();
                        for (const currentHookOption of hookItem.option) {
                            currentHookOption.beforeMethodInvoke?.(args, abortController, thisArg, tempResult);
                        }
                        if (abortController.signal.aborted) {
                            resolve(tempResult.current);
                            return
                        }
                        try {
                            tempResult.current = await originMethod.apply(thisArg, args);
                        } catch (error: any) {
                            if (error.stack) {
                                error.stack = filterErrorStack(error.stack);
                            }
                            reject(error as Error)
                            return
                        }
                        for (const currentHookOption of hookItem.option) {
                            currentHookOption.afterMethodInvoke?.(args, tempResult, thisArg);
                        }
                        resolve(tempResult.current);
                    })
                },
                has(target, p) {
                    if (p === hookSymbol) {
                        return true;
                    }
                    return Reflect.has(target, p);
                },
            })
            const hookDefineResult = Reflect.defineProperty(parent, methodName, {
                value: hookEntry,
                writable: hookOption.descriptor?.writable ?? true,
                enumerable: hookOption.descriptor?.enumerable ?? true,
                configurable: hookOption.descriptor?.configurable ?? true,
            });
            if (hookDefineResult) {
                const hookItem: MethodHookMapItem = {
                    originMethod,
                    option: [hookOption]
                }
                hookedMethodKeyMap.set(key, hookItem);
                return true;
            }
            return false;
        } catch (error) {
            console.warn("Error on hooking async method:", error);
            return false;
        }
    }
    static createProxyObject<T extends object>(target: T, handler: ProxyHandler<T>, targetName: string): T {
        target.toString = createBypassToStringMethod(targetName);
        const proxyTarget = new OriginObjects.Proxy(target, handler);
        return proxyTarget;
    }
    static unhookMethod(id: string) {
        for (const mapItem of hookedMethodKeyMap) {
            const newMapItems = mapItem[1].option.filter(item => item.id !== id);
            hookedMethodKeyMap.set(mapItem[0], {
                originMethod: mapItem[1].originMethod,
                option: newMapItems
            })
        }
    }
    static unhookMethods(id:string[]){
        for (const idItem of id) {
            this.unhookMethod(idItem);
        }
    }
    static isModifiedMethodOrObject(method: any) {
        return OriginObjects.Reflect.has(method, hookSymbol);
    }
}