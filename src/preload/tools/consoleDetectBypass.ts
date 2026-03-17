import { Hooker } from "../../hook/hooker";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
//不移出来某些情况下会崩溃
function isSensitiveType(item: any) {
    if (item instanceof Function || item instanceof RegExp || item instanceof Date || item instanceof HTMLElement || item instanceof Array) {
        return true
    }
    return false
}
export class ConsoleDetectBypass extends AbstractTool {
    private LogsBeforeMethodInvokeFunction(args: any[], abortController: AbortController) {
        for (let i = 0; i < args.length; i++) {
            if (isSensitiveType(args[i])) {
                args[i] = null
            }
        }
        // 全都是空了 不打印 避免刷屏
        if (args.every(item => item === null)) abortController.abort();
    }
    onMount(): void {
        Hooker.hookMethod(console, "table", "console.table", {
            id: "console.table:bypass",
            beforeMethodInvoke(_args, abortController) {
                // 正常极少用+性能太差 直接屏蔽
                abortController.abort();
            },
        });
        Hooker.hookMethod(console, "debug", "console.debug", {
            id: "console.debug:bypass",
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        })
        Hooker.hookMethod(console, "log", "console.log", {
            id: "console.log:bypass",
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "info", "console.info", {
            id: "console.info:bypass",
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "warn", "console.warn", {
            id: "console.warn:bypass",
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "error", "console.error", {
            id: "console.error:bypass",
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "dir", "console.dir", {
            id: "console.dir:bypass",
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        Hooker.hookMethod(console, "dirxml", "console.dirxml", {
            id: "console.dirxml:bypass",
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            }
        });
        Hooker.hookMethod(console, "clear", "console.clear", {
            id: "console.clear:bypass",
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            }
        });
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