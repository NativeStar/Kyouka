import { Hooker } from "../../hook/hooker";
import { OriginObjects } from "../../hook/originObjects";
import type { PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class PrintLogStack extends AbstractTool {
    private appendStackItem(args: any[]) {
        const obj = { stack: null }
        OriginObjects.Error.captureStackTrace(obj);
        args.push(obj.stack)
    }
    onMount(): void {
        Hooker.hookMethod(console, "debug", {
            beforeMethodInvoke: this.appendStackItem
        })
        Hooker.hookMethod(console, "log", {
            beforeMethodInvoke: this.appendStackItem
        });
        Hooker.hookMethod(console, "info", {
            beforeMethodInvoke: this.appendStackItem
        });
        Hooker.hookMethod(console, "warn", {
            beforeMethodInvoke: this.appendStackItem
        });
        Hooker.hookMethod(console, "error", {
            beforeMethodInvoke: this.appendStackItem
        });
    }
    get preHookMethodList(): PreHookOption[] {
        return [
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
            }
        ]
    }
}