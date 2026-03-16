export const DefaultExtensionConfig={
    removeCsp:false,
    bypassConsoleDetect:false,
    blockClipboardWrite:false,
    blockConsole:false,
    blockError:false,
    blockEval:false
} as const;
export type ExtensionConfig = typeof DefaultExtensionConfig;
export type IpcObject={
    getConfig:()=>ExtensionConfig
}