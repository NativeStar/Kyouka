import { Hooker } from "../../hook/hooker";

export default function initBlockEvalExecute() {
    Hooker.hookMethod(window, "eval", "window.eval", {
        beforeMethodInvoke(_args, abortController) {
            abortController.abort();
        },
    });
    Hooker.unhookMethod("pre#window.eval")
}