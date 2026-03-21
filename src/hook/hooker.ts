import { OriginObjects } from "./originObjects";
import { createBypassToStringMethod, filterErrorStack } from "./util";

export interface TempHookResultWrapper<T = any> {
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
    beforeMethodInvoke?: (args: any[], abortController: AbortController, thisArg: any, tempMethodResult: TempHookResultWrapper<T>) => void;
    /**
     * @param args 方法参数
     * @param tempMethodResult 可修改返回值
     * @param thisArg this指向
     */
    afterMethodInvoke?: (args: any[], tempMethodResult: TempHookResultWrapper<T>, thisArg: any) => void;
}
interface GetterAndSetterHookOption<T = any> {
    descriptor?: Omit<PropertyDescriptor, "set" | "get" | "value" | "writable">;
    beforeGetterInvoke?: (abortController: AbortController, thisArg: any, tempMethodResult: TempHookResultWrapper<T>) => void;
    afterGetterInvoke?: (tempMethodResult: TempHookResultWrapper<T>, thisArg: any) => void;
    beforeSetterInvoke?: (arg: T, abortController: AbortController, thisArg: any) => void;
}
interface MethodHookMapItem {
    originMethod: Function;
    option: MethodHookOption[];
}
interface GetterAndSetterHookMapItem<T = any> {
    originGetter: (() => T) | null;
    originSetter: ((value: T) => void) | null;
    option: GetterAndSetterHookOption[];
}
const hookedMethodKeyMap: Map<string, MethodHookMapItem> = new Map();
const hookedGetterAndSetterKeyMap: Map<string, GetterAndSetterHookMapItem> = new Map();
export const hookSymbol = Symbol();
export class Hooker {
    private static originObjectSource = OriginObjects;
    static setOriginObjectSource(source: typeof OriginObjects) {
        this.originObjectSource = source;
    }
    static hookMethod<T = any>(parent: any, target: string | Function, key: string, hookOption: MethodHookOption<T>): boolean {
        const methodName = typeof target === 'string' ? target : target.name;
        try {
            if (!parent || typeof parent[methodName] !== 'function') {
                return false;
            }
            if (hookedMethodKeyMap.has(key)) {
                const currentHookMethodItem = hookedMethodKeyMap.get(key)!;
                //判断id是否重复
                if (hookOption.id && currentHookMethodItem.option.some(item => item.id === hookOption.id)) {
                    this.originObjectSource.console.warn(`already has hook id:${hookOption.id}`);
                    return false
                }
                currentHookMethodItem.option.push(hookOption);
                hookedMethodKeyMap.set(key, currentHookMethodItem);
                return true
            }
            const originMethod: Function = this.originObjectSource.Reflect.get(parent, methodName);
            // 屏蔽枚举和重写
            this.originObjectSource.Reflect.defineProperty(originMethod, 'toString', {
                value: createBypassToStringMethod(methodName),
                writable: false,
                enumerable: false,
                configurable: true,
            });
            const hookEntryProxy = new this.originObjectSource.Proxy(originMethod, {
                apply(_target, thisArg, args) {
                    const hookItem = hookedMethodKeyMap.get(key);
                    if (!hookItem) {
                        //没有hook
                        return originMethod.apply(thisArg, args);
                    }
                    const tempResult: TempHookResultWrapper<T> = {
                        current: null as T
                    }
                    const abortController = new Hooker.originObjectSource.AbortController();
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
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
            });
            const originDescriptor = this.originObjectSource.Reflect.getOwnPropertyDescriptor(parent, methodName) ?? {
                configurable: true,
                writable: true,
                enumerable: true,
            }
            // 下面三个属性只有第一个hook的可以生效
            const hookDefineResult = this.originObjectSource.Reflect.defineProperty(parent, methodName, {
                value: hookEntryProxy,
                writable: hookOption.descriptor?.writable ?? originDescriptor.writable,
                enumerable: hookOption.descriptor?.enumerable ?? originDescriptor.enumerable,
                configurable: hookOption.descriptor?.configurable ?? originDescriptor.configurable,
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
            this.originObjectSource.console.warn("Error on hooking method:", error);
            return false;
        }
    }
    static hookAsyncMethod<T = any>(parent: any, target: string | Function, key: string, hookOption: MethodHookOption<T>): boolean {
        const methodName = typeof target === 'string' ? target : target.name;
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
            const originMethod: Function = this.originObjectSource.Reflect.get(parent, methodName);
            try {
                this.originObjectSource.Reflect.defineProperty(originMethod, 'toString', {
                    value: createBypassToStringMethod(methodName),
                    writable: false,
                    enumerable: false,
                    configurable: true,
                });
            } catch (error) {
                this.originObjectSource.console.warn("Error on create bypass toString detect method:", error);
            }
            const hookEntry = new this.originObjectSource.Proxy(originMethod, {
                apply(_target, thisArg, args) {
                    return new Hooker.originObjectSource.Promise<T>(async (resolve, reject) => {
                        const hookItem = hookedMethodKeyMap.get(key);
                        if (!hookItem) {
                            //没有hook
                            resolve(await originMethod.apply(thisArg, args))
                            return
                        }
                        const tempResult: TempHookResultWrapper<T> = {
                            current: undefined as T
                        }
                        const abortController = new Hooker.originObjectSource.AbortController();
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
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
            })
            const originDescriptor = this.originObjectSource.Reflect.getOwnPropertyDescriptor(parent, methodName) ?? {
                configurable: true,
                writable: true,
                enumerable: true,
            }
            const hookDefineResult = this.originObjectSource.Reflect.defineProperty(parent, methodName, {
                value: hookEntry,
                writable: hookOption.descriptor?.writable ?? originDescriptor.writable,
                enumerable: hookOption.descriptor?.enumerable ?? originDescriptor.enumerable,
                configurable: hookOption.descriptor?.configurable ?? originDescriptor.configurable,
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
            this.originObjectSource.console.warn("Error on hooking async method:", error);
            return false;
        }
    }
    static hookGetterAndSetter<T = any>(parent: any, target: string, key: string, hookOption: GetterAndSetterHookOption<T>) {
        if (!parent) return false
        if (hookedGetterAndSetterKeyMap.has(key)) {
            const currentHookGetterAndSetterItem = hookedGetterAndSetterKeyMap.get(key)!;
            currentHookGetterAndSetterItem.option.push(hookOption);
            hookedGetterAndSetterKeyMap.set(key, currentHookGetterAndSetterItem);
            return true
        }
        const originDescriptor = this.originObjectSource.Reflect.getOwnPropertyDescriptor(parent, target);
        // 拿不到描述符
        if (!originDescriptor) return false;
        const originGetter: (() => T) | undefined = originDescriptor.get;
        const originSetter: ((value: T) => void) | undefined = originDescriptor.set;
        // 啥都没有...
        if (!originGetter && !originSetter) return false
        const tempHookEntry: { getter: (() => T) | undefined, setter: ((value: T) => void) | undefined } = { getter: originGetter, setter: originSetter }
        if (originGetter) {
            this.originObjectSource.Reflect.defineProperty(originGetter, 'toString', {
                value: createBypassToStringMethod(target, "get"),
                writable: false,
                enumerable: true,
                configurable: true,
            });
            tempHookEntry.getter = new this.originObjectSource.Proxy(originGetter, {
                apply(_target, thisArg) {
                    const hookItem = hookedGetterAndSetterKeyMap.get(key);
                    if (!hookItem) {
                        //没有hook
                        return originGetter.apply(thisArg);
                    }
                    const tempResult: TempHookResultWrapper<T> = {
                        current: null as T
                    }
                    const abortController = new Hooker.originObjectSource.AbortController();
                    for (const currentHookOption of hookItem.option) {
                        currentHookOption.beforeGetterInvoke?.(abortController, thisArg, tempResult);
                    }
                    if (abortController.signal.aborted) {
                        return tempResult.current ?? undefined;
                    }
                    try {
                        tempResult.current = originGetter.apply(thisArg);
                    } catch (error: any) {
                        if (error.stack) {
                            error.stack = filterErrorStack(error.stack);
                        }
                        throw error;
                    }
                    for (const currentHookOption of hookItem.option) {
                        currentHookOption.afterGetterInvoke?.(tempResult, thisArg);
                    }
                    return tempResult.current;
                },
                has(target, p) {
                    if (p === hookSymbol) {
                        return true;
                    }
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
            });
            if (originSetter) {
                this.originObjectSource.Reflect.defineProperty(originSetter, 'toString', {
                    value: createBypassToStringMethod(target, "set"),
                    writable: false,
                    enumerable: true,
                    configurable: true,
                });
                tempHookEntry.setter = new this.originObjectSource.Proxy(originSetter, {
                    apply(_target, thisArg, arg: [any]) {
                        const hookItem = hookedGetterAndSetterKeyMap.get(key);
                        if (!hookItem) {
                            //没有hook
                            return originSetter.apply(thisArg, arg);
                        }
                        const abortController = new Hooker.originObjectSource.AbortController();
                        for (const currentHookOption of hookItem.option) {
                            currentHookOption.beforeSetterInvoke?.(arg[0], abortController, thisArg);
                        }
                        if (abortController.signal.aborted) {
                            return
                        }
                        try {
                            originSetter.apply(thisArg, arg);
                        } catch (error: any) {
                            if (error.stack) {
                                error.stack = filterErrorStack(error.stack);
                            }
                            throw error;
                        }
                        return
                    },
                    has(target, p) {
                        if (p === hookSymbol) {
                            return true;
                        }
                        return Hooker.originObjectSource.Reflect.has(target, p);
                    },
                });
            }
            const hookDefineResult = this.originObjectSource.Reflect.defineProperty(parent, target, {
                get: tempHookEntry.getter,
                set: tempHookEntry.setter,
                enumerable: hookOption.descriptor?.enumerable ?? true,
                configurable: hookOption.descriptor?.configurable ?? true,
            });
            if (hookDefineResult) {
                const hookItem: GetterAndSetterHookMapItem = {
                    originGetter: originGetter ?? null,
                    originSetter: originSetter ?? null,
                    option: [hookOption]
                }
                hookedGetterAndSetterKeyMap.set(key, hookItem);
                return true;
            }
            return false;
        }
    }
    static createProxyObject<T extends object>(target: T, handler: ProxyHandler<T>, targetName: string): T {
        //这个没必要屏蔽枚举
        target.toString = createBypassToStringMethod(targetName);
        const proxyTarget = new this.originObjectSource.Proxy(target, handler);
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
    /**
     * 在对象hook完善前手动获取这个打标记
     * @returns 
     */
    static getHookSymbol() {
        return hookSymbol;
    }
    static unhookMethods(id: string[]) {
        for (const idItem of id) {
            this.unhookMethod(idItem);
        }
    }
    static isModifiedMethodOrObject(method: any) {
        return this.originObjectSource.Reflect.has(method, hookSymbol);
    }
}