import {type Hooker } from "js-hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockStringCodeExecute extends AbstractTool {
    private static readonly abortInvokeTargetAttrs: string[] = ["innerText", "innerHTML", "text", "textContent"] as const;
    onMount(_config: never, hooker: Hooker): void {
        hooker.hookMethod(window, "eval", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        hooker.hookObject(window,"Function",{
            beforeConstruct(_args, abortController, tempObject, originConstruct) {
                abortController.abort();
                tempObject.current = originConstruct("");
            },
        })
        hooker.hookMethod(window, "setTimeout",{
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        hooker.hookMethod(window, "setInterval", {
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        //script标签相关
        for (const keyword of BlockStringCodeExecute.abortInvokeTargetAttrs) {
            hooker.hookAccessor(HTMLScriptElement.prototype, keyword as keyof HTMLScriptElement, {
                beforeSetterInvoke(_arg, abortController) {
                    abortController.abort();
                },
            });
        }
        hooker.hookAccessor(HTMLScriptElement.prototype, "src", {
            beforeSetterInvoke(arg, abortController) {
                if (typeof arg ==="string") {
                    const srcString=(arg as TrustedScriptURL|string) instanceof TrustedScriptURL ? arg.toString() : arg;
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
                    const srcString:string=(args[1] as TrustedScriptURL|string) instanceof TrustedScriptURL ? args[1].toString() : args[1];
                    if (srcString.startsWith("blob:") || srcString.startsWith("data:")) {
                        abortController.abort();
                    }
                }
            },
        })
        hooker.hookMethod(HTMLScriptElement.prototype, "setHTMLUnsafe",{
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        hooker.hookMethod(HTMLScriptElement.prototype, "setHTML", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: window,
                methodName: "setTimeout",
                id: "pre#window.setTimeout",
                type:"method"
            },
            {
                parent: window,
                methodName: "setInterval",
                id: "pre#window.setInterval",
                type:"method"
            },
        ]
    }
}