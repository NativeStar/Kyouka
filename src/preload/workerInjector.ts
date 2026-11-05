import { type OriginObjects, type Hooker } from "js-hooker";
import type { ExtensionConfig } from "../types";
let preloadUrl: string;
let originalObjects: typeof OriginObjects | null = null;
let extensionConfig: ExtensionConfig;
function getBootstrapCode(workerType: WorkerType) {
    if (workerType === "classic") {
        return `importScripts("${preloadUrl}");\n`;
    } else {
        return `import "${preloadUrl}"\n`
    }
}
export function init(hooker: Hooker, preloadUrlArg: string, originRef: typeof OriginObjects, config: ExtensionConfig) {
    preloadUrl = preloadUrlArg;
    originalObjects = originRef;
    extensionConfig = config;
    hooker.hookObject(window, "Worker", {
        beforeConstruct: async ([url, options], abortController, tempObject, origin) => {
            abortController.abort()
            tempObject.current = new InjectWorkerWrapper(origin, url, options)
        }
    })
}
class InjectWorkerWrapper implements AbstractWorker {
    private _onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null
    private _onmessage: ((this: AbstractWorker, ev: MessageEvent<any>) => any) | null = null
    private _onmessageerror: ((this: AbstractWorker, ev: MessageEvent<any>) => any) | null = null
    private cachedAddEventListenerCall: { type: string, listener: any, options: any }[] = []
    private cachedRemoveEventListenerCall: { type: string, listener: any, options: any }[] = []
    private cachedPostMessageCall: { message: any, transfer?: any }[] = []
    private internalWorker: Worker | null = null
    private cachedDispatchEventCall: { event: Event }[] = []
    private isInternalWorkerInitd = false
    constructor(rawWorker: typeof Worker, url: string | URL, options?: WorkerOptions) {
        let workerType: WorkerType = "classic"
        let hrefUrl: string | null = null
        if (options && options.type) {
            workerType = options.type
        }
        hrefUrl = url instanceof URL ? url.href : url
        const bootstrapCode = getBootstrapCode(workerType)
        const dataDispatcher = (e: MessageEvent) => {
            if (originalObjects?.Reflect?.has(e.data, "type") && e.data.type === "kyouka-worker-hook-init") {
                e.stopPropagation()
                e.stopImmediatePropagation()
                e.preventDefault()
                this.internalWorker!.postMessage(
                    {
                        originUrl: hrefUrl,
                        loadMode: hrefUrl.startsWith("blob:") ? "blob" : "url",
                        baseUrl: location.href,
                        workerType: workerType,
                        config: extensionConfig
                    })
            } else if (originalObjects?.Reflect?.has(e.data, "type") && e.data.type === "kyouka-worker-origin-code-executed") {
                this.isInternalWorkerInitd = true
                e.stopPropagation()
                e.stopImmediatePropagation()
                e.preventDefault()
                this.internalWorker!.removeEventListener("message", dataDispatcher)
                this.initInternalWorker()
            }
        }
        this.internalWorker = new rawWorker(URL.createObjectURL(new Blob([bootstrapCode], { type: "application/javascript" })), options)
        this.internalWorker.addEventListener("message", dataDispatcher)
    }
    addEventListener(type: any, listener: any, options?: any): void {
        if (this.internalWorker && this.isInternalWorkerInitd) {
            this.internalWorker?.addEventListener(type, listener, options)
        } else {
            this.cachedAddEventListenerCall.push({ type, listener, options })
        }
    }
    removeEventListener(type: any, listener: any, options?: any): void {
        if (this.internalWorker && this.isInternalWorkerInitd) {
            this.internalWorker?.removeEventListener(type, listener, options)
        } else {
            this.cachedRemoveEventListenerCall.push({ type, listener, options })
        }
    }
    dispatchEvent(event: Event): boolean {
        if (this.internalWorker && this.isInternalWorkerInitd) {
            return this.internalWorker?.dispatchEvent(event)
        } else {
            this.cachedDispatchEventCall.push({ event })
            return true
        }
    }
    postMessage(message: any, transfer: any): void {
        if (this.internalWorker && this.isInternalWorkerInitd) {
            this.internalWorker?.postMessage(message, transfer)
        } else {
            this.cachedPostMessageCall.push({ message, transfer })
        }
    }
    terminate(): void {
        this.internalWorker?.terminate()
    }
    get onerror() {
        return this._onerror
    }
    private initInternalWorker() {
        if (this.internalWorker && this.isInternalWorkerInitd) {
            this.internalWorker.onerror = this._onerror
            this.internalWorker.onmessage = this._onmessage
            this.internalWorker.onmessageerror = this._onmessageerror
            // 挂载和卸载监听器
            for (const call of this.cachedAddEventListenerCall) {
                this.internalWorker.addEventListener(call.type, call.listener, call.options)
            }
            for (const call of this.cachedRemoveEventListenerCall) {
                this.internalWorker.removeEventListener(call.type, call.listener, call.options)
            }
            // 消息
            for (const call of this.cachedPostMessageCall) {
                this.internalWorker.postMessage(call.message, call.transfer)
            }
            // 事件
            for (const call of this.cachedDispatchEventCall) {
                this.internalWorker.dispatchEvent(call.event)
            }
        }
    }
    set onerror(handler) {
        this._onerror = handler
        if (this.internalWorker) {
            this.internalWorker.onerror = handler
        }
    }

    get onmessage() {
        return this._onmessage
    }

    set onmessage(handler) {
        this._onmessage = handler
        if (this.internalWorker) {
            this.internalWorker.onmessage = handler
        }
    }

    get onmessageerror() {
        return this._onmessageerror
    }

    set onmessageerror(handler) {
        this._onmessageerror = handler
        if (this.internalWorker) {
            this.internalWorker.onmessageerror = handler
        }
    }
}