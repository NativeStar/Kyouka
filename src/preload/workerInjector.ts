import { type OriginObjects, type Hooker } from "js-hooker";
import type { ExtensionConfig } from "../types";
import { InjectWorkerWrapper } from "./classes/injectWorkerWrapper";
import { InjectSharedWorkerWrapper } from "./classes/injectSharedWorkerWrapper";
export function init(hooker: Hooker, preloadUrlArg: string, originRef: typeof OriginObjects, config: ExtensionConfig) {
    hooker.hookObject(window, "Worker", {
        beforeConstruct: async ([url, options], abortController, tempObject, origin) => {
            abortController.abort()
            tempObject.current = new InjectWorkerWrapper(origin, url, preloadUrlArg, originRef, config, options)
        }
    });
    hooker.hookObject(window, "SharedWorker", {
        beforeConstruct: async ([url, nameOrOptions], abortController, tempObject, origin) => {
            abortController.abort()
            tempObject.current = new InjectSharedWorkerWrapper(origin, url, preloadUrlArg, originRef, config, typeof nameOrOptions === "string" ? { name: nameOrOptions } : nameOrOptions)
        }
    });
}
