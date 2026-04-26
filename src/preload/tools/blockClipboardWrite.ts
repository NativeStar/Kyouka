import {type Hooker} from "js-hooker"
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockClipboardWrite extends AbstractTool {
    private originLog:typeof console.log=console.log;
    override onMount(_config: never, hooker: Hooker): void {
        if (navigator.clipboard) {
            const objectRef=this;
            this.originLog=hooker.ensureOriginExecutable(console.log);
            hooker.hookAsyncMethod(navigator.clipboard, "writeText", {
                beforeMethodInvoke(args, abortController) {
                    objectRef.originLog(`Blocked write clipboard text: ${args[0]}`)
                    abortController.abort();
                }
            });
            hooker.hookAsyncMethod(navigator.clipboard, "write", {
                beforeMethodInvoke(args, abortController) {
                    objectRef.originLog(`Blocked write clipboard: ${args[0]}`)
                    abortController.abort();
                }
            });
        }
        hooker.hookMethod(document, "execCommand", {
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
            { parent: navigator.clipboard, methodName: "write", id: "pre#navigator.clipboard.write", useAsyncHook: true ,type:"method"},
            { parent: navigator.clipboard, methodName: "writeText", id: "pre#navigator.clipboard.writeText", useAsyncHook: true ,type:"method"},
            { parent: document, methodName: "execCommand", id: "pre#document.execCommand" ,type:"method"}
        ] : [{ parent: document, methodName: "execCommand", id: "pre#document.execCommand" ,type:"method"}]
    }
}