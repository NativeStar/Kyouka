import {type Hooker } from "js-hooker";
import type { PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class StringDetectBypass extends AbstractTool {
    onMount(_config: never, hooker: Hooker): void {
        hooker.hookMethod(Function.prototype, "toString",{
            beforeMethodInvoke(_args, abortController, thisArg, tempMethodResult) {
                if (thisArg instanceof Function && hooker.isHooked(thisArg)) {
                    tempMethodResult.current = `function ${thisArg.name}() { [native code] }`
                    abortController.abort();
                }
            },
            afterMethodInvoke(_args, tempMethodResult, thisArg) {
                //内部方法代码
                if (tempMethodResult.current.includes('TypeError("Function.prototype.toString requires that ')) {
                    tempMethodResult.current = `function ${(thisArg as Function).name}() { [native code] }`
                }
            },
        })
    }
    override get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: Function.prototype,
                methodName: "toString",
                id: "pre#Function.prototype.toString",
                type:"method"
            }
        ]
    }
}