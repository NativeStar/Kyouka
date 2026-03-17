export const DefaultExtensionConfig = {
    removeCsp: false,
    bypassConsoleDetect: false,
    blockClipboardWrite: false,
    blockConsole: false,
    blockError: false,
    blockEval: false,
    stringDetectBypass:false
} as const;
export type ExtensionConfig = typeof DefaultExtensionConfig;
export type IpcObject = {
    getConfig: () => ExtensionConfig
}
export type PreHookOption = {
    parent: any,
    methodName: string,
    key: string,
    id: string
    useAsyncHook?: boolean
}