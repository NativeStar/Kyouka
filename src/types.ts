import { type HookType} from "js-hooker";

export const DefaultExtensionConfig = {
    removeCsp: false,
    bypassConsoleDetect: false,
    blockClipboardWrite: false,
    blockConsole: false,
    blockError: false,
    blockStringCodeExecute: false,
    stringDetectBypass:false,
    enableGui:true,
    printStackInLogs:false
} as const;
export type ExtensionConfig = typeof DefaultExtensionConfig;
export type IpcObject = {
    getConfig: () => ExtensionConfig
}
export type PreHookOption = {
    parent: any
    methodName: string
    type:HookType
    id: string
    useAsyncHook?: boolean
}