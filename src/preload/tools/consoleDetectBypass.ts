import { Hooker } from "../../hook/hooker";

function isSensitiveType(item: any) {
    if (item instanceof Function || item instanceof RegExp || item instanceof Date || item instanceof HTMLElement || item instanceof Array) {
        return true
    }
    return false
}
function LogsBeforeMethodInvokeFunction(args: any[], abortController: AbortController) {
    for (let i = 0; i < args.length; i++) {
        if (isSensitiveType(args[i])) {
            args[i] = null
        }
    }
    // 全都是空了 不打印 避免刷屏
    if (args.every(item => item === null)) abortController.abort();
}
export function initConsoleDetectBypass() {
    Hooker.hookMethod(console, "table", "console.table", {
        id: "console.table:bypass",
        beforeMethodInvoke(args, abortController) {
            // 正常极少用+性能太差 直接屏蔽
            abortController.abort();
        },
    });
    Hooker.hookMethod(console, "debug", "console.debug", {
        id: "console.debug:bypass",
        beforeMethodInvoke: LogsBeforeMethodInvokeFunction
    })
    Hooker.hookMethod(console, "log", "console.log", {
        id: "console.log:bypass",
        beforeMethodInvoke: LogsBeforeMethodInvokeFunction
    });
    Hooker.hookMethod(console, "info", "console.info", {
        id: "console.info:bypass",
        beforeMethodInvoke: LogsBeforeMethodInvokeFunction
    });
    Hooker.hookMethod(console, "warn", "console.warn", {
        id: "console.warn:bypass",
        beforeMethodInvoke: LogsBeforeMethodInvokeFunction
    });
    Hooker.hookMethod(console, "error", "console.error", {
        id: "console.error:bypass",
        beforeMethodInvoke: LogsBeforeMethodInvokeFunction
    });
    Hooker.hookMethod(console, "dir", "console.dir", {
        id: "console.dir:bypass",
        beforeMethodInvoke(args, abortController) {
            abortController.abort();
        },
    });
    Hooker.hookMethod(console, "dirxml", "console.dirxml", {
        id: "console.dirxml:bypass",
        beforeMethodInvoke(args, abortController) {
            abortController.abort();
        }
    });
    Hooker.hookMethod(console, "clear", "console.clear", {
        id: "console.clear:bypass",
        beforeMethodInvoke(args, abortController) {
            abortController.abort();
        }
    });
    //移除占位hook避免可能的性能浪费
    Hooker.unhookMethods([
        "pre#console.table",
        "pre#console.debug",
        "pre#console.log",
        "pre#console.info",
        "pre#console.warn",
        "pre#console.error",
        "pre#console.dir",
        "pre#console.dirxml",
        "pre#console.clear"
    ])
}