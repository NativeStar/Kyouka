export interface LanguageLocation {
    timezone: string;
}
export const languageLocations: {
    [key: string]: LanguageLocation
} = {
    "en-US": {
        timezone: "America/New_York",
    },
    "ja-JP": {
        timezone: "Asia/Tokyo",
    },
    "ko-KR": {
        timezone: "Asia/Seoul",
    }
}