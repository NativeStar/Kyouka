export function windowAlert(tabId: number, message: string) {
    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: (text: string) => {
            alert(text)
        },
        args: [message]
    }).catch(e => console.log(e))
}
export function windowPrompt(tabId: number, message: string, defaultValue?: string): Promise<string | null> {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: {
                tabId: tabId
            },
            func: (text: string, defaultValue?: string) => {
                return prompt(text, defaultValue)
            },
            args: [message, defaultValue]
        }).then(res => {
            resolve(res[0]?.result ?? null)
        }).catch(e => console.log(e))
    })
}
export function encodeBase64(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}
export function decodeBase64(base64: string): string {
    const normalized = base64
        .trim()
        .replace(/\s+/g, "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded = normalized.padEnd(
        normalized.length + (4 - normalized.length % 4) % 4,
        "="
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}