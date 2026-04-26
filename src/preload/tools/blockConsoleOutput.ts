import {type Hooker } from "js-hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockConsoleOutput extends AbstractTool {    private rejectAllInvoke(_args: any[], abortController: AbortController) {
        abortController.abort();
    }
    onMount(_config: never, hooker: Hooker): void {
        hooker.hookMethod(console, "table", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "debug", {
            beforeMethodInvoke: this.rejectAllInvoke
        })
        hooker.hookMethod(console, "log", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "info", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "warn", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "error", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "dir", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "dirxml", {
            beforeMethodInvoke: this.rejectAllInvoke
        });
        hooker.hookMethod(console, "clear", {
            beforeMethodInvoke: this.rejectAllInvoke
        })
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: console,
                methodName: "table",
                id: "pre#console.table",
                type:"method"
            },
            {
                parent: console,
                methodName: "debug",
                id: "pre#console.debug",
                type:"method"

            },
            {
                parent: console,
                methodName: "log",
                id: "pre#console.log",
                type:"method"
            },
            {
                parent: console,
                methodName: "info",
                id: "pre#console.info",
                type:"method"
            },
            {
                parent: console,
                methodName: "warn",
                id: "pre#console.warn",
                type:"method"
            },
            {
                parent: console,
                methodName: "error",
                id: "pre#console.error",
                type:"method"
            },
            {
                parent: console,
                methodName: "dir",
                id: "pre#console.dir",
                type:"method"
            },
            {
                parent: console,
                methodName: "dirxml",
                id: "pre#console.dirxml",
                type:"method"
            },
            {
                parent: console,
                methodName: "clear",
                id: "pre#console.clear",
                type:"method"
            }
        ]
    }
}