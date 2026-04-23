import { Hooker } from "../../hook/hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockConsoleOutput extends AbstractTool {
    private rejectAllInvoke(_args: any[], abortController: AbortController) {
        abortController.abort();
    }
    onMount(): void {
        Hooker.hookMethod(console, "table", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "debug", {
            beforeMethodInvoke: this.rejectAllInvoke
        })
        Hooker.hookMethod(console, "log", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "info", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "warn", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "error", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "dir", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "dirxml", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        Hooker.hookMethod(console, "clear", {
            beforeMethodInvoke: this.rejectAllInvoke
        })
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: console,
                methodName: "table",
                key: "console.table",
                id: "pre#console.table"
            },
            {
                parent: console,
                methodName: "debug",
                key: "console.debug",
                id: "pre#console.debug"
            },
            {
                parent: console,
                methodName: "log",
                key: "console.log",
                id: "pre#console.log"
            },
            {
                parent: console,
                methodName: "info",
                key: "console.info",
                id: "pre#console.info"
            },
            {
                parent: console,
                methodName: "warn",
                key: "console.warn",
                id: "pre#console.warn"
            },
            {
                parent: console,
                methodName: "error",
                key: "console.error",
                id: "pre#console.error"
            },
            {
                parent: console,
                methodName: "dir",
                key: "console.dir",
                id: "pre#console.dir"
            },
            {
                parent: console,
                methodName: "dirxml",
                key: "console.dirxml",
                id: "pre#console.dirxml"
            },
            {
                parent: console,
                methodName: "clear",
                key: "console.clear",
                id: "pre#console.clear"
            }
        ]
    }
}