import { type HookType } from "js-hooker";

export const DefaultExtensionConfig = {
    removeCsp: false,
    bypassConsoleDetect: false,
    blockClipboardWrite: false,
    blockConsole: false,
    blockError: false,
    blockStringCodeExecute: false,
    stringDetectBypass: false,
    enableGui: true,
    printStackInLogs: false,
    allowContextMenu: false,
    enableContextMenu: true,
    disableCacheApi: false,
    blockServiceWorker: false,
    blockStorageOperation: false,
    changeLanguageLocation: "unset"
};
export type ExtensionConfig = typeof DefaultExtensionConfig;
export type IpcObject = {
    getConfig: () => ExtensionConfig
}
export type PreHookOption = {
    parent: any
    methodName: string
    type: HookType
    id: string
    useAsyncHook?: boolean
}
export type SnapshotJson = {
    metadata: {
        version: number,
        host: string
    },
    data: {
        cookie: chrome.cookies.Cookie[],
        localStorage: {
            key: string,
            value: string
        }[],
        sessionStorage: {
            key: string,
            value: string
        }[]
    }
}
export interface LanguageLocation {
    timezone: string;
    navigatorLanguages: string[];
    acceptLanguage: string;
}
export const languageLocations: {
    [key: string]: LanguageLocation
} = {
    "en-US": {
        timezone: "America/New_York",
        navigatorLanguages: ["en-US", "en"],
        acceptLanguage: "en-US,en;q=0.9",
    },
    "ja-JP": {
        timezone: "Asia/Tokyo",
        navigatorLanguages: ["ja-JP", "ja", "en-US", "en"],
        acceptLanguage: "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    "ko-KR": {
        timezone: "Asia/Seoul",
        navigatorLanguages: ["ko-KR", "ko", "en-US", "en"],
        acceptLanguage: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }
}