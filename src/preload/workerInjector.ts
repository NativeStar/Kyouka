import { type OriginObjects, type Hooker } from "js-hooker";
import type { ExtensionConfig } from "../types";
import { InjectWorkerWrapper } from "./classes/injectWorkerWrapper";
// let preloadUrl: string;
// let originalObjects: typeof OriginObjects | null = null;
// let extensionConfig: ExtensionConfig;
export function init(hooker: Hooker, preloadUrlArg: string, originRef: typeof OriginObjects, config: ExtensionConfig) {
    // preloadUrl = preloadUrlArg;
    // originalObjects = originRef;
    // extensionConfig = config;
    hooker.hookObject(window, "Worker", {
        beforeConstruct: async ([url, options], abortController, tempObject, origin) => {
            abortController.abort()
            tempObject.current = new InjectWorkerWrapper(origin, url, preloadUrlArg, originRef, config, options)
        }
    })
}
