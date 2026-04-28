import { type Hooker } from "js-hooker";
import type { PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class StringDetectBypass extends AbstractTool {
    onMount(_config: never, hooker: Hooker): void {
        hooker.hookMethod(Function.prototype, "toString", {
            beforeMethodInvoke(_args, abortController, thisArg, tempMethodResult) {
                if (thisArg instanceof Function && hooker.isHooked(thisArg)) {
                    const originMethod = hooker.ensureOriginExecutable<Function>(thisArg);
                    tempMethodResult.current = `function ${originMethod.name}() { [native code] }`
                    abortController.abort();
                }
            },
            afterMethodInvoke(_args, tempMethodResult, thisArg) {
                //内部方法代码
                if (tempMethodResult.current.includes('TypeError("Function.prototype.toString requires that ') && thisArg instanceof Function) {
                    const originMethod = hooker.ensureOriginExecutable<Function>(thisArg);
                    tempMethodResult.current = `function ${originMethod.name}() { [native code] }`
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
                type: "method"
            }
        ]
    }
}