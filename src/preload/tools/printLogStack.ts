import {type Hooker} from "js-hooker"
import type { PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class PrintLogStack extends AbstractTool {
    private backupCaptureStackTrace=Error.captureStackTrace
    private appendStackItem(args: any[]) {
        const obj = { stack: null }
        this.backupCaptureStackTrace!(obj);
        args.push(obj.stack)
    }
    onMount(_config: never, hooker: Hooker): void {
        hooker.hookMethod(console, "debug", {
            beforeMethodInvoke: this.appendStackItem.bind(this)
        })
        hooker.hookMethod(console, "log", {
            beforeMethodInvoke: this.appendStackItem.bind(this)
        });
        hooker.hookMethod(console, "info", {
            beforeMethodInvoke: this.appendStackItem.bind(this)
        });
        hooker.hookMethod(console, "warn", {
            beforeMethodInvoke: this.appendStackItem.bind(this)
        });
        hooker.hookMethod(console, "error", {
            beforeMethodInvoke: this.appendStackItem.bind(this)
        });
    }
     override get preHookMethodList(): PreHookOption[] {
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