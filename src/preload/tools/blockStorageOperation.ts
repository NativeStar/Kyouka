import { type Hooker ,FastUtils} from "js-hooker";
import { type ExtensionConfig, type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockStorageOperation extends AbstractTool { 
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        FastUtils.hookAbortMethodExecute(hooker,Storage.prototype,"setItem","sync");
        FastUtils.hookAbortMethodExecute(hooker,Storage.prototype,"removeItem","sync");
        FastUtils.hookAbortMethodExecute(hooker,Storage.prototype,"clear","sync");
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: Storage.prototype,
                methodName: "setItem",
                type:"method",
                id: "pre#blockStorageOperation",
            },
            {
                parent: Storage.prototype,
                methodName: "removeItem",
                type: "method",
                id: "pre#blockStorageOperation"
            },
            {
                parent: Storage.prototype,
                methodName: "clear",
                type: "method",
                id: "pre#blockStorageOperation"
            }
        ]
    }
}