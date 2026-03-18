import { Hooker } from "../../hook/hooker";
import { PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class PrintLogStack extends AbstractTool {
    private appendStackItem(args: any[]){
        const obj={stack:null}
        Error.captureStackTrace(obj);
        args.push(obj.stack)
    }
    onMount(): void {
        Hooker.hookMethod(console, "debug", "console.debug", {
            beforeMethodInvoke: this.appendStackItem
        })
        Hooker.hookMethod(console, "log", "console.log", {
            beforeMethodInvoke: this.appendStackItem
        });
        Hooker.hookMethod(console, "info", "console.info", {
            beforeMethodInvoke: this.appendStackItem
        });
        Hooker.hookMethod(console, "warn", "console.warn", {
            beforeMethodInvoke: this.appendStackItem
        });
        Hooker.hookMethod(console, "error", "console.error", {
            beforeMethodInvoke: this.appendStackItem
        });
    }
    get preHookMethodList(): PreHookOption[] {
        return [
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
            }
        ]
    }
}