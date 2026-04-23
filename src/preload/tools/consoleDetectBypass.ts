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
        Hooker.hookMethod(console, "table", {
            beforeMethodInvoke(_args, abortController) {
                // 正常极少用+性能太差 直接屏蔽
                abortController.abort();
            },
        });
        Hooker.hookMethod(console, "debug",{
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        })
        Hooker.hookMethod(console, "log", {
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "info", {
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "warn", {
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "error", {
            beforeMethodInvoke: this.LogsBeforeMethodInvokeFunction
        });
        Hooker.hookMethod(console, "dir", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        Hooker.hookMethod(console, "dirxml",{
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            }
        });
        Hooker.hookMethod(console, "clear", {
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
                id: "pre#console.table"
            },
            {
                parent: console,
                methodName: "debug",
                id: "pre#console.debug"
            },
            {
                parent: console,
                methodName: "log",
                id: "pre#console.log"
            },
            {
                parent: console,
                methodName: "info",
                id: "pre#console.info"
            },
            {
                parent: console,
                methodName: "warn",
                id: "pre#console.warn"
            },
            {
                parent: console,
                methodName: "error",
                id: "pre#console.error"
            },
            {
                parent: console,
                methodName: "dir",
                id: "pre#console.dir"
            },
            {
                parent: console,
                methodName: "dirxml",
                id: "pre#console.dirxml"
            },
            {
                parent: console,
                methodName: "clear",
                id: "pre#console.clear"
            }
        ]
    }
}