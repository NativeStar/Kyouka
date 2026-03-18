import { Hooker } from "../../hook/hooker";
import { OriginObjects } from "../../hook/originObjects";
import { type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockStringCodeExecute extends AbstractTool {
    onMount(): void {
        const hookedTagSymbol = Hooker.getHookSymbol();
        Hooker.hookMethod(window, "eval", "window.eval", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        const functionProxy = Hooker.createProxyObject(window.Function, {
            has(target, p) {
                // 标记
                if (p === hookedTagSymbol) {
                    return true;
                }
                return Reflect.has(target, p);
            },
            construct(target) {
                //直接空参数
                return new target()
            },
        }, "Function");
        Reflect.defineProperty(window, "Function", {
            value: functionProxy,
            configurable: true,
            writable: true,
        });
        Hooker.hookMethod(window, "setTimeout", "window.setTimeout", {
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
        Hooker.hookMethod(window, "setInterval", "window.setInterval", {
            beforeMethodInvoke(args, abortController) {
                if (typeof args[0] === "string") {
                    abortController.abort();
                }
            },
        });
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: window,
                methodName: "eval",
                key: "window.eval",
                id: "pre#window.eval"
            },
            {
                parent: window,
                methodName: "setTimeout",
                key: "window.setTimeout",
                id: "pre#window.setTimeout"
            },
            {
                parent: window,
                methodName: "setInterval",
                key: "window.setInterval",
                id: "pre#window.setInterval"
            },
        ]
    }
}