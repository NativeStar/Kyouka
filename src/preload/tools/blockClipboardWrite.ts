import { FastUtils, type Hooker } from "js-hooker"
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
import { getDocument } from "../util";
export class BlockClipboardWrite extends AbstractTool {
    private internalDocument = getDocument();
    override onMount(_config: never, hooker: Hooker): void {
        if (navigator.clipboard) {
            FastUtils.hookAbortMethodExecute(hooker, navigator.clipboard, "writeText", "async");
            FastUtils.hookAbortMethodExecute(hooker, navigator.clipboard, "write", "async");
        }
        hooker.hookMethod(this.internalDocument, "execCommand", {
            beforeMethodInvoke(args, abortController, _thisArg, tempMethodResult) {
                if (args[0] === "copy") {
                    tempMethodResult.current = true;
                    abortController.abort();
                }
            },
        })
    }
    override get preHookMethodList(): PreHookOption[] {
        //非https不能使用剪切板API
        return isSecureContext ? [
            { parent: navigator.clipboard, methodName: "write", id: "pre#navigator.clipboard.write", useAsyncHook: true, type: "method" },
            { parent: navigator.clipboard, methodName: "writeText", id: "pre#navigator.clipboard.writeText", useAsyncHook: true, type: "method" },
            { parent: this.internalDocument, methodName: "execCommand", id: "pre#document.execCommand", type: "method" }
        ] : [{ parent: this.internalDocument, methodName: "execCommand", id: "pre#document.execCommand", type: "method" }]
    }
}