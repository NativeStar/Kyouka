import type { ExtensionConfig } from "../../types";
import { getWorkerInjectBootstrapCode } from "../util";
import { type OriginObjects } from "js-hooker";
let originObjects: typeof OriginObjects | null = null;


export class InjectSharedWorkerWrapper implements AbstractWorker {
    private _onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null
    private _onmessage: ((this: AbstractWorker, ev: MessageEvent<any>) => any) | null = null
    private _onmessageerror: ((this: AbstractWorker, ev: MessageEvent<any>) => any) | null = null
    private cachedAddEventListenerCall: { type: string, listener: any, options: any }[] = []
    private cachedRemoveEventListenerCall: { type: string, listener: any, options: any }[] = []
    private cachedPostMessageCall: { message: any, transfer?: any }[] = []
    protected internalWorker: SharedWorker | null = null
    private cachedDispatchEventCall: { event: Event }[] = []
    private isInternalWorkerInitd = false
    public _port: any = null
    constructor(rawWorker: typeof SharedWorker, url: string | URL, preloadUrl: string, originRef: typeof OriginObjects, extensionConfig: ExtensionConfig, options?: WorkerOptions) {
        let workerType: WorkerType = "classic"
        originObjects = originRef;
        let hrefUrl: string | null = null
        if (options && options.type) {
            workerType = options.type
        }
        hrefUrl = url instanceof URL ? url.href : url
        const bootstrapCode = getWorkerInjectBootstrapCode(workerType, preloadUrl)
        const sharedWorkerWrapperClass = this
        const internalMessagePortClass = class InternalMessagePortClass implements MessagePort {
            protected cachedAddEventListenerCall: { type: string, listener: any, options: any }[] = []
            protected cachedRemoveEventListenerCall: { type: string, listener: any, options: any }[] = []
            close(): void {
                sharedWorkerWrapperClass.internalWorker?.port.close()
            }
            addEventListener(type: any, listener: any, options?: any): void {
                if (sharedWorkerWrapperClass.internalWorker) {
                    sharedWorkerWrapperClass.internalWorker.port.addEventListener(type, listener, options)
                } else {
                    this.cachedAddEventListenerCall.push({ type, listener, options })
                }
            }
            postMessage(message: unknown, arg2?: any): void {
                if (sharedWorkerWrapperClass.internalWorker) {
                    sharedWorkerWrapperClass.internalWorker?.port.postMessage(message, arg2)
                } else {
                    sharedWorkerWrapperClass.cachedPostMessageCall.push({ message, transfer: arg2 })
                }
            }
            get onmessage() {
                return sharedWorkerWrapperClass._onmessage
            }

            set onmessage(handler: any) {
                sharedWorkerWrapperClass._onmessage = handler
                if (sharedWorkerWrapperClass.internalWorker) {
                    sharedWorkerWrapperClass.port.onmessage = handler
                }
            }
            start(): void { }
            removeEventListener(type: any, listener: unknown, options?: unknown): void {
                if (sharedWorkerWrapperClass.internalWorker && sharedWorkerWrapperClass.isInternalWorkerInitd) {
                    sharedWorkerWrapperClass?.removeEventListener(type, listener, options)
                } else {
                    this.cachedRemoveEventListenerCall.push({ type, listener, options })
                }
            }
            dispatchEvent(event: unknown): boolean {
                return true
            }
            get onmessageerror() {
                return sharedWorkerWrapperClass._onmessageerror
            }
            set onmessageerror(handler: any) {
                sharedWorkerWrapperClass._onmessageerror = handler
                if (sharedWorkerWrapperClass.internalWorker) {
                    sharedWorkerWrapperClass.internalWorker.port.onmessageerror = handler
                }
            }

        }
        this._port = new internalMessagePortClass()
        const dataDispatcher = (e: MessageEvent) => {
            if (originObjects?.Reflect?.has(e.data, "type") && e.data.type === "kyouka-worker-hook-init") {
                e.stopPropagation()
                e.stopImmediatePropagation()
                e.preventDefault()
                this.internalWorker?.port.start()
                this.internalWorker!.port.postMessage(
                    {
                        originUrl: hrefUrl,
                        loadMode: hrefUrl.startsWith("blob:") ? "blob" : "url",
                        baseUrl: location.href,
                        workerType: workerType,
                        config: extensionConfig
                    })
            } else if (originObjects?.Reflect?.has(e.data, "type") && e.data.type === "kyouka-worker-origin-code-executed") {
                this.isInternalWorkerInitd = true
                e.stopPropagation()
                e.stopImmediatePropagation()
                e.preventDefault()
                this.internalWorker!.port.removeEventListener("message", dataDispatcher)
                this.initInternalWorker()
            }
        }
        this.internalWorker = new rawWorker(URL.createObjectURL(new Blob([bootstrapCode], { type: "application/javascript" })), options)
        this.internalWorker!.port.addEventListener("message", dataDispatcher)
        this.internalWorker!.port.start()
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
            this.internalWorker?.port.postMessage(message, transfer)
        } else {
            this.cachedPostMessageCall.push({ message, transfer })
        }
    }
    get onerror() {
        return this._onerror
    }
    private initInternalWorker() {
        if (this.internalWorker && this.isInternalWorkerInitd) {
            this.internalWorker.onerror = this._onerror
            // 挂载和卸载监听器
            for (const call of this.cachedAddEventListenerCall) {
                this.internalWorker.addEventListener(call.type, call.listener, call.options)
            }
            for (const call of this.cachedRemoveEventListenerCall) {
                this.internalWorker.removeEventListener(call.type, call.listener, call.options)
            }
            // 消息
            for (const call of this.cachedPostMessageCall) {
                this.internalWorker.port.postMessage(call.message, call.transfer)
            }
            // 事件
            for (const call of this.cachedDispatchEventCall) {
                this.internalWorker.dispatchEvent(call.event)
            }
            for (const call of this._port.cachedAddEventListenerCall) {
                this.internalWorker.port.addEventListener(call.type, call.listener, call.options)
            }
            for (const call of this._port.cachedRemoveEventListenerCall) {
                this.internalWorker.port.removeEventListener(call.type, call.listener, call.options)
            }
        }
    }
    set onerror(handler) {
        this._onerror = handler
        if (this.internalWorker) {
            this.internalWorker.onerror = handler
        }
    }

    get port() {
        if (this.internalWorker) {
            return this.internalWorker.port
        }
        return this._port
    }
    set port(port: any) { }
}