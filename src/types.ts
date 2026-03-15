export const DefaultExtensionConfig={
    removeCsp:false,
    bypassConsoleDetect:false,
} as const;
export type ExtensionConfig = typeof DefaultExtensionConfig;
export type IpcObject={
    getConfig:()=>ExtensionConfig
}