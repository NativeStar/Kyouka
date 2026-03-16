import { type ExtensionConfig } from "../types";

export function processErrorEvent(config: ExtensionConfig, event: Event) {
    if (config.blockError) {
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
    }
}