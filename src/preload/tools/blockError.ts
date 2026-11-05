import { type ExtensionConfig } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class BlockError extends AbstractTool {
    private unmountController: AbortController = new AbortController();
    private eventHandlerDescriptor: PropertyDescriptor = {
        configurable: false,
        set() { },
        get() {
            return () => true
        }
    }
    private isBlockErrorEnabled = false;
    private processErrorEvent(event: Event) {
        if (this.isBlockErrorEnabled) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }
    }
    override onMount(config: ExtensionConfig): void {
        this.isBlockErrorEnabled = config.blockError;
        Reflect.defineProperty(globalThis, "onerror", this.eventHandlerDescriptor);
        Reflect.defineProperty(globalThis, "onunhandledrejection", this.eventHandlerDescriptor);
        Reflect.defineProperty(globalThis, "onrejectionhandled", this.eventHandlerDescriptor);
    }
    override onPreload(): string[] | void {
        globalThis.addEventListener("error", (event) => this.processErrorEvent(event),{signal:this.unmountController.signal,capture:true});
        globalThis.addEventListener("unhandledrejection", (event) => this.processErrorEvent(event),{signal:this.unmountController.signal,capture:true});
        globalThis.addEventListener("rejectionhandled", (event) => this.processErrorEvent(event),{signal:this.unmountController.signal,capture:true});
    }
    onUnmount(): void {
        this.unmountController.abort();
    }
}