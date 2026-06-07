import { type Hooker ,FastUtils} from "js-hooker";
import { type ExtensionConfig } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
export class BlockStorageOperation extends AbstractTool { 
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        FastUtils.hookAbortMethodExecute(hooker,Storage.prototype,"setItem","sync");
        FastUtils.hookAbortMethodExecute(hooker,Storage.prototype,"removeItem","sync");
        FastUtils.hookAbortMethodExecute(hooker,Storage.prototype,"clear","sync");
    }
}