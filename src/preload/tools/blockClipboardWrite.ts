import { Hooker } from "../../hook/hooker";
import { OriginObjects } from "../../hook/originObjects";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockClipboardWrite extends AbstractTool {
    onMount(): void {
        if (navigator.clipboard) {
            Hooker.hookAsyncMethod(navigator.clipboard, "writeText", {
                beforeMethodInvoke(args, abortController) {
                    OriginObjects.console.log(`Blocked write clipboard text: ${args[0]}`)
                    abortController.abort();
                }
            });
            Hooker.hookAsyncMethod(navigator.clipboard, "write", {
                beforeMethodInvoke(args, abortController) {
                    OriginObjects.console.log(`Blocked write clipboard: ${args[0]}`)
                    abortController.abort();
                }
            });
        }
        Hooker.hookMethod(document, "execCommand", {
            beforeMethodInvoke(args, abortController, _thisArg, tempMethodResult) {
                if (args[0] === "copy") {
                    tempMethodResult.current = true;
                    abortController.abort();
                }
            },
        })
    }
    get preHookMethodList(): PreHookOption[] {
        //非https不能使用剪切板API
        return isSecureContext ? [
            { parent: navigator.clipboard, methodName: "write", id: "pre#navigator.clipboard.write", useAsyncHook: true },
            { parent: navigator.clipboard, methodName: "writeText", id: "pre#navigator.clipboard.writeText", useAsyncHook: true },
            { parent: document, methodName: "execCommand", id: "pre#document.execCommand" }
        ] : [{ parent: document, methodName: "execCommand", id: "pre#document.execCommand" }]
    }
}