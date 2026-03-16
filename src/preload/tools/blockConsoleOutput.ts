import { Hooker } from "../../hook/hooker";

function rejectAllInvoke(args: any[], abortController: AbortController) {
    abortController.abort();
}
export default function initBlockConsoleOutput() {
    Hooker.hookMethod(console, "table", "console.table", {
        id: "console.table:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "debug", "console.debug", {
        id: "console.debug:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    })
    Hooker.hookMethod(console, "log", "console.log", {
        id: "console.log:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "info", "console.info", {
        id: "console.info:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "warn", "console.warn", {
        id: "console.warn:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "error", "console.error", {
        id: "console.error:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "dir", "console.dir", {
        id: "console.dir:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "dirxml", "console.dirxml", {
        id: "console.dirxml:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    });
    Hooker.hookMethod(console, "clear", "console.clear", {
        id: "console.clear:bypassReject",
        beforeMethodInvoke: rejectAllInvoke
    })
}