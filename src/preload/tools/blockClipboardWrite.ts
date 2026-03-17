import { Hooker } from "../../hook/hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockClipboardWrite extends AbstractTool {
    onMount(): void {
        Hooker.hookAsyncMethod(navigator.clipboard, "writeText", "navigator.clipboard.writeText", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            }
        });
        Hooker.hookAsyncMethod(navigator.clipboard, "write", "navigator.clipboard.write", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            }
        });
        Hooker.hookMethod(document, "execCommand", "document.execCommand", {
            beforeMethodInvoke(args, abortController, _thisArg, tempMethodResult) {
                if (args[0] === "copy") {
                    tempMethodResult.current = true;
                    abortController.abort();
                }
            },
        })
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            { parent: navigator.clipboard, methodName: "write", key: "navigator.clipboard.write", id: "pre#navigator.clipboard.write", useAsyncHook: true },
            { parent: navigator.clipboard, methodName: "writeText", key: "navigator.clipboard.writeText", id: "pre#navigator.clipboard.writeText", useAsyncHook: true },
            { parent: document, methodName: "execCommand", key: "document.execCommand", id: "pre#document.execCommand" }
        ]
    }
}