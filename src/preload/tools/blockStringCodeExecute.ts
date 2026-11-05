import { type Hooker, FastUtils } from "js-hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
import { isRunningInWorker } from "../util";
export class BlockStringCodeExecute extends AbstractTool {
    private static readonly abortInvokeTargetAttrs: string[] = ["innerText", "innerHTML", "text", "textContent"] as const;
    onMount(_config: never, hooker: Hooker): void {
        FastUtils.hookAbortMethodExecute(hooker, globalThis, "eval", "sync");
        hooker.hookObject(globalThis, "Function", {
            beforeConstruct(_args, abortController, tempObject, originConstruct) {
                abortController.abort();
                tempObject.current = originConstruct("");
            },
        })
        hooker.hookMethod(globalThis, "setTimeout", {
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        hooker.hookMethod(globalThis, "setInterval", {
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        //script标签相关
        if (!isRunningInWorker()) {
            for (const keyword of BlockStringCodeExecute.abortInvokeTargetAttrs) {
                hooker.hookAccessor(HTMLScriptElement.prototype, keyword as keyof HTMLScriptElement, {
                    beforeSetterInvoke(_arg, abortController) {
                        abortController.abort();
                    },
                });
            }
            hooker.hookAccessor(HTMLScriptElement.prototype, "src", {
                beforeSetterInvoke(arg, abortController) {
                    if (typeof arg === "string") {
                        const srcString = (arg as TrustedScriptURL | string) instanceof TrustedScriptURL ? arg.toString() : arg;
                        if (srcString.startsWith("blob:") || srcString.startsWith("data:")) {
                            abortController.abort();
                        }
                    }
                },
            });
            //attr相关
            hooker.hookMethod(HTMLScriptElement.prototype, "setAttribute", {
                beforeMethodInvoke(args, abortController) {
                    if (BlockStringCodeExecute.abortInvokeTargetAttrs.includes(args[0])) {
                        abortController.abort();
                        return
                    }
                    if (args[0] === "src") {
                        const srcString: string = (args[1] as TrustedScriptURL | string) instanceof TrustedScriptURL ? args[1].toString() : args[1];
                        if (srcString.startsWith("blob:") || srcString.startsWith("data:")) {
                            abortController.abort();
                        }
                    }
                },
            })
            FastUtils.hookAbortMethodExecute(hooker, HTMLScriptElement.prototype, "setHTMLUnsafe", "sync");
            FastUtils.hookAbortMethodExecute(hooker, HTMLScriptElement.prototype, "setHTML", "sync");
        }
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: globalThis,
                methodName: "setTimeout",
                id: "pre#window.setTimeout",
                type: "method"
            },
            {
                parent: globalThis,
                methodName: "setInterval",
                id: "pre#window.setInterval",
                type: "method"
            },
        ]
    }
}