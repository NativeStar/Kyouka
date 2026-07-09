import { FastUtils, type Hooker } from "js-hooker";
import type { ExtensionConfig, PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class DisableCacheApi extends AbstractTool {
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        FastUtils.hookAbortMethodExecute(hooker,Cache.prototype,"add","async");
        FastUtils.hookAbortMethodExecute(hooker,Cache.prototype,"addAll","async");
        FastUtils.hookAbortMethodExecute(hooker,Cache.prototype,"put","async");
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: Cache.prototype,
                methodName: "add",
                type: "method",
                id: "pre#disableCacheApi",
                useAsyncHook: true
            },
            {
                parent: Cache.prototype,
                methodName: "addAll",
                type: "method",
                id: "pre#disableCacheApi",
                useAsyncHook: true
            },
            {
                parent: Cache.prototype,
                methodName: "put",
                type: "method",
                id: "pre#disableCacheApi",
                useAsyncHook: true
            },
        ];
    }
}