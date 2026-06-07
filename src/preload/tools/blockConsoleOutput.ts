import { type Hooker ,FastUtils} from "js-hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockConsoleOutput extends AbstractTool {
    private rejectAllInvoke(_args: any[], abortController: AbortController) {
        abortController.abort();
    }
    onMount(_config: never, hooker: Hooker): void {
        //有id的保持原hook法用作判断 等更新hooker库支持自定义id
        hooker.hookMethod(console, "table", {
            beforeMethodInvoke: this.rejectAllInvoke,
            id: "toolBlockConsoleExec"
        });
        hooker.hookMethod(console, "log", {
            beforeMethodInvoke: this.rejectAllInvoke,
            id: "toolBlockConsoleExec"
        });
        FastUtils.hookAbortMethodExecute(hooker,console,"debug","sync");
        FastUtils.hookAbortMethodExecute(hooker,console,"info","sync");
        FastUtils.hookAbortMethodExecute(hooker,console,"warn","sync");
        FastUtils.hookAbortMethodExecute(hooker,console,"error","sync");
        FastUtils.hookAbortMethodExecute(hooker,console,"dir","sync");
        FastUtils.hookAbortMethodExecute(hooker,console,"dirxml","sync");
        FastUtils.hookAbortMethodExecute(hooker,console,"clear","sync");
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: console,
                methodName: "table",
                id: "pre#console.table",
                type: "method"
            },
            {
                parent: console,
                methodName: "debug",
                id: "pre#console.debug",
                type: "method"

            },
            {
                parent: console,
                methodName: "log",
                id: "pre#console.log",
                type: "method"
            },
            {
                parent: console,
                methodName: "info",
                id: "pre#console.info",
                type: "method"
            },
            {
                parent: console,
                methodName: "warn",
                id: "pre#console.warn",
                type: "method"
            },
            {
                parent: console,
                methodName: "error",
                id: "pre#console.error",
                type: "method"
            },
            {
                parent: console,
                methodName: "dir",
                id: "pre#console.dir",
                type: "method"
            },
            {
                parent: console,
                methodName: "dirxml",
                id: "pre#console.dirxml",
                type: "method"
            },
            {
                parent: console,
                methodName: "clear",
                id: "pre#console.clear",
                type: "method"
            }
        ]
    }
}