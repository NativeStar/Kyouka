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
    locationString:string
}
export const languageLocations: {
    [key: string]: LanguageLocation
} = {
    "en-US": {
        timezone: "America/New_York",
        navigatorLanguages: ["en-US", "en"],
        acceptLanguage: "en-US,en;q=0.9",
        locationString: "Eastern Daylight Time"
    },
    "ja-JP": {
        timezone: "Asia/Tokyo",
        navigatorLanguages: ["ja-JP", "ja", "en-US", "en"],
        acceptLanguage: "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
        locationString:"日本標準時"
    },
    "ko-KR": {
        timezone: "Asia/Seoul",
        navigatorLanguages: ["ko-KR", "ko", "en-US", "en"],
        acceptLanguage: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        locationString:"한국 표준시"
    },
    "ru-RU": {
        timezone: "Europe/Moscow",
        navigatorLanguages: ["ru-RU", "ru", "en-US", "en"],
        acceptLanguage: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        locationString: "Москва, стандартное время"
    },
    "en-GB": {
        timezone: "Europe/London",
        navigatorLanguages: ["en-GB", "en"],
        acceptLanguage: "en-GB,en;q=0.9",
        locationString: "British Summer Time"
    },
    "en-SG": {
        timezone: "Asia/Singapore",
        navigatorLanguages: ["en-SG", "en-US", "en"],
        acceptLanguage: "en-SG,en-US;q=0.9,en;q=0.8",
        locationString: "Singapore Standard Time"
    },
    "fr-FR": {
        timezone: "Europe/Paris",
        navigatorLanguages: ["fr-FR", "fr", "en-US", "en"],
        acceptLanguage: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        locationString: "heure d’été d’Europe centrale"
    },
    "en-IN": {
        timezone: "Asia/Kolkata",
        navigatorLanguages: ["en-IN", "en-US", "en", "hi"],
        acceptLanguage: "en-IN,en-US;q=0.9,en;q=0.8,hi;q=0.7",
        locationString: "India Standard Time"
    }
}
