import { type ExtensionConfig } from "../../types";
import { AbstractTool } from "../classes/abstractTool";

export class BlockError extends AbstractTool {
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
    onMount(config: ExtensionConfig): void {
        this.isBlockErrorEnabled = config.blockError;
        Reflect.defineProperty(window, "onerror", this.eventHandlerDescriptor);
        Reflect.defineProperty(window, "onunhandledrejection", this.eventHandlerDescriptor);
        Reflect.defineProperty(window, "onrejectionhandled", this.eventHandlerDescriptor);
    }
    onPreload(): string[] | void {
        window.addEventListener("error", (event) => this.processErrorEvent(event));
        window.addEventListener("unhandledrejection", (event) => this.processErrorEvent(event));
        window.addEventListener("rejectionhandled", (event) => this.processErrorEvent(event));
    }
}