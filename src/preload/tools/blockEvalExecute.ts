import { Hooker } from "../../hook/hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockEvalExecute extends AbstractTool {
    onMount(): void {
        Hooker.hookMethod(window, "eval", "window.eval", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: window,
                methodName: "eval",
                key: "window.eval",
                id: "pre#window.eval"
            }
        ]
    }
}