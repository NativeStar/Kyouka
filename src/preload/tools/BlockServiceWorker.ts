import { FastUtils, type Hooker } from "js-hooker";
import { type ExtensionConfig, type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockServiceWorker extends AbstractTool {
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        FastUtils.hookAbortMethodExecute(hooker,ServiceWorkerContainer.prototype,"register","async",void 0,{});
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: ServiceWorkerContainer.prototype,
                methodName: "register",
                type: "method",
                id: "pre#blockServiceWorker"
            }
        ];
    }
}