import { FastUtils, type Hooker } from "js-hooker";
import type { ExtensionConfig } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class DisableCacheApi extends AbstractTool {
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        FastUtils.hookAbortMethodExecute(hooker,Cache.prototype,"add","async");
        FastUtils.hookAbortMethodExecute(hooker,Cache.prototype,"addAll","async");
        FastUtils.hookAbortMethodExecute(hooker,Cache.prototype,"put","async");
    }

}