import { type Hooker } from "js-hooker";
import { AbstractTool } from "../classes/abstractTool";
import type { ExtensionConfig, PreHookOption } from "../../types";
export class AllowContextMenu extends AbstractTool {
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        hooker.hookMethod(Document.prototype, "addEventListener", {
            beforeMethodInvoke: ([eventName], abortController) => {
                if (eventName === "contextmenu") {
                    abortController.abort();
                }
            }
        });
        hooker.hookMethod(HTMLElement.prototype, "addEventListener", {
            beforeMethodInvoke: ([eventName], abortController) => {
                if (eventName === "contextmenu") {
                    abortController.abort();
                }
            }
        });
        hooker.hookAccessor(Document.prototype, "oncontextmenu", {
            beforeSetterInvoke(_arg, abortController) {
                abortController.abort();
            },
        })
        hooker.hookAccessor(HTMLElement.prototype, "oncontextmenu", {
            beforeSetterInvoke(_arg, abortController) {
                abortController.abort();
            },
        })
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: Document.prototype,
                methodName: "addEventListener",
                id: "pre#document.addEventListener",
                type: "method"
            },
            {
                parent: HTMLElement.prototype,
                methodName: "addEventListener",
                id: "pre#HTMLElement.addEventListener",
                type: "method"
            }
        ]
    }
}