import { Hooker } from "../../hook/hooker";

export default function initBlockClipboardWrite() {
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
    Hooker.unhookMethods(["pre#navigator.clipboard.write", "pre#navigator.clipboard.writeText","pre#document.execCommand"]);
}