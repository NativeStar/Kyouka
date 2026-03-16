export const DefaultExtensionConfig={
    removeCsp:false,
    bypassConsoleDetect:false,
    blockClipboardWrite:false,
    blockConsole:false,
    blockError:false
} as const;
export type ExtensionConfig = typeof DefaultExtensionConfig;
export type IpcObject={
    getConfig:()=>ExtensionConfig
}