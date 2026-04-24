import { Hooker } from "../../hook/hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockStringCodeExecute extends AbstractTool {
    private static readonly abortInvokeTargetAttrs: string[] = ["innerText", "innerHTML", "text", "textContent"] as const;
    onMount(): void {
        const hookedTagSymbol = Hooker.getHookSymbol();
        Hooker.hookMethod(window, "eval", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        // const functionProxy = Hooker.createProxyObject(window.Function, {
        //     has(target, p) {
        //         // 标记
        //         if (p === hookedTagSymbol) {
        //             return true;
        //         }
        //         return Reflect.has(target, p);
        //     },
        //     construct(target) {
        //         //直接空参数
        //         return new target()
        //     },
        // }, "Function");
        // Reflect.defineProperty(window, "Function", {
        //     value: functionProxy,
        //     configurable: true,
        //     writable: true,
        // });
        Hooker.hookMethod(window, "setTimeout",{
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        Hooker.hookMethod(window, "setInterval", {
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        //script标签相关
        for (const keyword of BlockStringCodeExecute.abortInvokeTargetAttrs) {
            Hooker.hookAccessor(HTMLScriptElement.prototype, keyword as keyof HTMLScriptElement, {
                beforeSetterInvoke(_arg, abortController) {
                    abortController.abort();
                },
            });
        }
        Hooker.hookAccessor(HTMLScriptElement.prototype, "src", {
            beforeSetterInvoke(arg, abortController) {
                const srcString=(arg as TrustedScriptURL|string) instanceof TrustedScriptURL ? arg.toString() : arg;
                if (srcString.startsWith("blob:") || srcString.startsWith("data:")) {
                    abortController.abort();
                }
            },
        });
        //attr相关
        Hooker.hookMethod(HTMLScriptElement.prototype, "setAttribute", {
            beforeMethodInvoke(args, abortController) {
                if (BlockStringCodeExecute.abortInvokeTargetAttrs.includes(args[0])) {
                    abortController.abort();
                    return
                }
                if (args[0] === "src") {
                    const srcString:string=(args[1] as TrustedScriptURL|string) instanceof TrustedScriptURL ? args[1].toString() : args[1];
                    if (srcString.startsWith("blob:") || srcString.startsWith("data:")) {
                        abortController.abort();
                    }
                }
            },
        })
        Hooker.hookMethod(HTMLScriptElement.prototype, "setHTMLUnsafe",{
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        Hooker.hookMethod(HTMLScriptElement.prototype, "setHTML", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: window,
                methodName: "setTimeout",
                id: "pre#window.setTimeout"
            },
            {
                parent: window,
                methodName: "setInterval",
                id: "pre#window.setInterval"
            },
        ]
    }
}