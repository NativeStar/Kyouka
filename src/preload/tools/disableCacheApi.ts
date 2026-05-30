import type { Hooker } from "js-hooker";
import type { ExtensionConfig } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class DisableCacheApi extends AbstractTool {
    private abortExecute(_args:any[],abortController:AbortController){
        abortController.abort();
    }
    onMount(_config: ExtensionConfig, hooker: Hooker): void {
        hooker.hookAsyncMethod(Cache.prototype,"add" ,{
            beforeMethodInvoke:this.abortExecute
        });
        hooker.hookAsyncMethod(Cache.prototype,"addAll" ,{
            beforeMethodInvoke:this.abortExecute
        });
        hooker.hookAsyncMethod(Cache.prototype,"put" ,{
            beforeMethodInvoke:this.abortExecute
        });
    }

}