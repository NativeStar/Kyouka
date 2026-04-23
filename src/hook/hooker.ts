import { OriginObjects } from "./originObjects";
import { createBypassToStringMethod, filterErrorStack } from "./util";
import type { AnyFunctionType, MethodByName, TempHookResultWrapper, MethodHookOption, AccessorHookOption, GetterAndSetterHookMapItem, MethodHookMapItem } from "./constance"
const hookedMethodMap: Map<object, Map<string, MethodHookMapItem>> = new Map();
const hookedGetterAndSetterKeyMap: Map<object, Map<string, GetterAndSetterHookMapItem>> = new Map();
const HOOKED_SYMBOL = Symbol();
const GET_ORIGIN_METHOD_SYMBOL = Symbol();
export class Hooker {
    private static originObjectSource = OriginObjects;
    static setOriginObjectSource(source: typeof OriginObjects) {
        this.originObjectSource = source;
    }
    static hookMethod<P extends object, K extends keyof P, F extends Extract<P[K], AnyFunctionType>, T = ReturnType<F>>(parent: P, target: K, hookOption: MethodHookOption<F>): boolean;
    static hookMethod<F extends AnyFunctionType, T = ReturnType<F>>(parent: object, target: F, hookOption: MethodHookOption<F>): boolean;
    static hookMethod<P extends object, K extends string, F extends MethodByName<P, K> = MethodByName<P, K>>(parent: P, target: K, hookOption: MethodHookOption<F>): boolean;
    static hookMethod(parent: any, target: string | AnyFunctionType, hookOption: MethodHookOption<AnyFunctionType>): boolean {
        const methodName = typeof target === 'string' ? target : target.name;
        try {
            if (!parent || typeof parent[methodName] !== 'function') {
                return false;
            }
            const methodExecutable = this.originObjectSource.Reflect.get(parent, methodName) as AnyFunctionType;
            let originMethod: Function = methodExecutable;
            //Proxy方法和原始方法在Map眼中不一样
            if (this.isModifiedMethodOrObject(methodExecutable)) {
                const rawOrigin = this.getOriginMethod(methodExecutable);
                if (rawOrigin !== null) originMethod = rawOrigin
            }
            const currentHookMethodItem = this.getMethodHookItem(parent, methodName)
            if (currentHookMethodItem) {
                //判断id是否重复
                if (hookOption.id && currentHookMethodItem.option.some(item => item.id === hookOption.id)) {
                    this.originObjectSource.console.warn(`already has hook id:${hookOption.id}`);
                    return false
                }
                currentHookMethodItem.option.push(hookOption);
                return true
            }
            // 屏蔽枚举和重写
            this.originObjectSource.Reflect.defineProperty(originMethod, 'toString', {
                value: createBypassToStringMethod(methodName),
                writable: false,
                enumerable: false,
                configurable: true,
            });
            const hookEntryProxy = new this.originObjectSource.Proxy(originMethod, {
                apply(_target, thisArg, args) {
                    const hookItem = Hooker.getMethodHookItem(parent, methodName);
                    if (!hookItem || hookItem.option.length === 0) {
                        //没有hook
                        return originMethod.apply(thisArg, args);
                    }
                    const tempResult: TempHookResultWrapper<ReturnType<typeof methodExecutable>> = {
                        current: undefined
                    }
                    const abortController = new Hooker.originObjectSource.AbortController();
                    for (const currentHookOption of hookItem.option) {
                        currentHookOption.beforeMethodInvoke?.(args, abortController, thisArg, tempResult, originMethod as AnyFunctionType);
                    }
                    if (abortController.signal.aborted) {
                        return tempResult.current;
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
                    if (p === HOOKED_SYMBOL) {
                        return true;
                    }
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
                get(target, p) {
                    if (p === GET_ORIGIN_METHOD_SYMBOL) {
                        return originMethod;
                    }
                    return Hooker.originObjectSource.Reflect.get(target, p);
                }
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
                    originParent: parent,
                    originMethod: originMethod as AnyFunctionType,
                    methodName,
                    option: [hookOption]
                }
                this.setMethodHookItem(parent, methodName, hookItem);
                return true;
            }
            return false;
        } catch (error) {
            this.originObjectSource.console.warn("Error on hooking method:", error);
            return false;
        }
    }

    static hookAsyncMethod<P extends object, K extends keyof P, F extends Extract<P[K], AnyFunctionType>, T = Awaited<ReturnType<F>>>(parent: P, target: K, hookOption: MethodHookOption<F, Awaited<ReturnType<F>>>): boolean;
    static hookAsyncMethod<F extends AnyFunctionType, T = Awaited<ReturnType<F>>>(parent: object, target: F, hookOption: MethodHookOption<F>): boolean;
    static hookAsyncMethod<P extends object, K extends string, F extends MethodByName<P, K> = MethodByName<P, K>>(parent: P, target: K, hookOption: MethodHookOption<F, Awaited<ReturnType<F>>>): boolean;
    static hookAsyncMethod(parent: Record<string, any>, target: string | AnyFunctionType, hookOption: MethodHookOption<AnyFunctionType>): boolean {
        const methodName = typeof target === 'string' ? target : target.name;
        try {
            if (!parent || typeof parent[methodName] !== 'function') {
                return false;
            }
            const methodExecutable = this.originObjectSource.Reflect.get(parent, methodName) as AnyFunctionType;
            let originMethod: Function = methodExecutable;
            if (this.isModifiedMethodOrObject(methodExecutable)) {
                const rawOrigin = this.getOriginMethod(methodExecutable);
                if (rawOrigin !== null) originMethod = rawOrigin
            }
            const currentHookMethodItem = this.getMethodHookItem(parent, methodName);
            if (currentHookMethodItem) {
                //判断id是否重复
                if (hookOption.id && currentHookMethodItem.option.some(item => item.id === hookOption.id)) {
                    this.originObjectSource.console.warn(`already has hook id:${hookOption.id}`);
                    return false
                }
                currentHookMethodItem.option.push(hookOption);
                return true
            }
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
                    return new Hooker.originObjectSource.Promise<any>(async (resolve, reject) => {
                        const hookItem = Hooker.getMethodHookItem(parent, methodName)
                        if (!hookItem || hookItem.option.length == 0) {
                            //没有hook
                            resolve(await originMethod.apply(thisArg, args))
                            return
                        }
                        const tempResult: TempHookResultWrapper<Awaited<ReturnType<typeof methodExecutable>>> = {
                            current: undefined
                        }
                        const abortController = new Hooker.originObjectSource.AbortController();
                        for (const currentHookOption of hookItem.option) {
                            currentHookOption.beforeMethodInvoke?.(args, abortController, thisArg, tempResult, originMethod as AnyFunctionType);
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
                    if (p === HOOKED_SYMBOL) {
                        return true;
                    }
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
                get(target, p) {
                    if (p === GET_ORIGIN_METHOD_SYMBOL) {
                        return originMethod;
                    }
                    return Hooker.originObjectSource.Reflect.get(target, p);
                }
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
                    originParent: parent,
                    originMethod: originMethod as AnyFunctionType,
                    methodName,
                    option: [hookOption]
                }
                this.setMethodHookItem(parent, methodName, hookItem);
                return true;
            }
            return false;
        } catch (error) {
            this.originObjectSource.console.warn("Error on hooking async method:", error);
            return false;
        }
    }
    static hookGetterAndSetter<P extends object, K extends keyof P>(parent: P, target: K, hookOption: AccessorHookOption<P, K>): boolean;
    static hookGetterAndSetter(parent: any, target: string, hookOption: AccessorHookOption<any, any>) {
        if (!parent) return false
        const currentHookItem = this.getAccessorHookItem(parent, target);
        if (currentHookItem) {
            currentHookItem.option.push(hookOption);
            return true
        }
        const originDescriptor = this.originObjectSource.Reflect.getOwnPropertyDescriptor(parent, target);
        // 拿不到描述符
        if (!originDescriptor) return false;
        let originGetter: (() => any) | undefined = originDescriptor.get;
        let originSetter: ((value: any) => void) | undefined = originDescriptor.set;
        // 啥都没有...
        if (!originGetter && !originSetter) return false
        if (originGetter && this.isModifiedMethodOrObject(originGetter)) {
            const tryGetter = this.getOriginMethod(originGetter);
            if (tryGetter) originGetter = tryGetter;
        }
        if (originSetter && this.isModifiedMethodOrObject(originSetter)) {
            const trySetter = this.getOriginMethod(originSetter);
            if (trySetter) originSetter = trySetter;
        }
        const tempHookEntry: { getter: (() => any) | undefined, setter: ((value: any) => void) | undefined } = { getter: originGetter, setter: originSetter }
        if (originGetter) {
            this.originObjectSource.Reflect.defineProperty(originGetter, 'toString', {
                value: createBypassToStringMethod(target, "get"),
                writable: false,
                enumerable: true,
                configurable: true,
            });
            tempHookEntry.getter = new this.originObjectSource.Proxy(originGetter, {
                apply(_target, thisArg) {
                    const hookItem = Hooker.getAccessorHookItem(parent, target);
                    if (!hookItem || hookItem.option.length == 0) {
                        //没有hook
                        return originGetter.apply(thisArg);
                    }
                    const tempResult: TempHookResultWrapper<ReturnType<typeof originGetter>> = {
                        current: undefined
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
                    if (p === HOOKED_SYMBOL) {
                        return true;
                    }
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
                get(target, p) {
                    if (p === GET_ORIGIN_METHOD_SYMBOL) {
                        return originGetter;
                    }
                    return Hooker.originObjectSource.Reflect.get(target, p);
                },
            });
        }
        if (originSetter) {
            this.originObjectSource.Reflect.defineProperty(originSetter, 'toString', {
                value: createBypassToStringMethod(target, "set"),
                writable: false,
                enumerable: true,
                configurable: true,
            });
            tempHookEntry.setter = new this.originObjectSource.Proxy(originSetter, {
                apply(_target, thisArg, arg: [any]) {
                    const hookItem = Hooker.getAccessorHookItem(parent, target);
                    if (!hookItem || hookItem.option.length == 0) {
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
                    if (p === HOOKED_SYMBOL) {
                        return true;
                    }
                    return Hooker.originObjectSource.Reflect.has(target, p);
                },
                get(target, p) {
                    if (p === GET_ORIGIN_METHOD_SYMBOL) {
                        return originSetter;
                    }
                    return Hooker.originObjectSource.Reflect.get(target, p);
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
            this.setAccessorHookItem(parent, target, hookItem);
            return true;
        }
        return false;
    }
    static createProxyObject<T extends object>(target: T, handler: ProxyHandler<T>, targetName: string): T {
        //这个没必要屏蔽枚举
        target.toString = createBypassToStringMethod(targetName);
        const proxyTarget = new this.originObjectSource.Proxy(target, handler);
        return proxyTarget;
    }
    // TODO 添加根据parent等进行精确unhook的方法 这样遍历性能太低了
    static unhookMethod(id: string) {
        for (const parentItem of hookedMethodMap) {
            for (const hookMapItem of parentItem[1]) {
                const newMapItems = hookMapItem[1].option.filter(item => item.id !== id);
                parentItem[1].set(hookMapItem[0], {
                    originMethod: hookMapItem[1].originMethod,
                    option: newMapItems,
                    originParent: hookMapItem[1].originParent,
                    methodName: hookMapItem[1].methodName
                })
            }
        }
    }
    /**
     * 在对象hook完善前手动获取这个打标记
     * @returns 
     */
    static getHookSymbol() {
        return HOOKED_SYMBOL;
    }
    static getOriginMethod(method: Function) {
        return this.originObjectSource.Reflect.get(method, GET_ORIGIN_METHOD_SYMBOL) ?? null;
    }
    static getMethodHookItem(parent: object, methodName: string) {
        return hookedMethodMap.get(parent)?.get(methodName) ?? null;
    }
    private static setMethodHookItem(parent: object, methodName: string, item: MethodHookMapItem) {
        let parentMap = hookedMethodMap.get(parent);
        if (!parentMap) {
            parentMap = new Map();
            hookedMethodMap.set(parent, parentMap);
        }
        parentMap.set(methodName, item);
    }
    static getAccessorHookItem(parent: object, name: string) {
        return hookedGetterAndSetterKeyMap.get(parent)?.get(name) ?? null;
    }
    private static setAccessorHookItem(parent: object, name: string, item: GetterAndSetterHookMapItem) {
        let parentMap = hookedGetterAndSetterKeyMap.get(parent);
        if (!parentMap) {
            parentMap = new Map();
            hookedGetterAndSetterKeyMap.set(parent, parentMap);
        }
        parentMap.set(name, item);
    }
    static unhookMethods(id: string[]) {
        for (const idItem of id) {
            this.unhookMethod(idItem);
        }
    }
    static isModifiedMethodOrObject(method: any) {
        if (!method) return false;
        return this.originObjectSource.Reflect.has(method, HOOKED_SYMBOL);
    }
}
