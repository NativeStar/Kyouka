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
    return new Promise((resolve, reject) => {
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
export function onSendMessageError(errorInstance: Error, currentTab: chrome.tabs.Tab) {
    if (errorInstance instanceof Error && errorInstance.message === "Could not establish connection. Receiving end does not exist.") {
        const tabId = currentTab.id;
        if (!tabId) return
        chrome.scripting.executeScript({
            target: {
                tabId
            },
            func: () => {
                if (window.confirm("扩展状态发生变更 需要刷新页面确保正常工作\n点击'确定'将执行刷新\n如多次刷新无效请重启浏览器")) window.location.reload()
            }
        }).catch(e => console.log(e))
    } else {
        //其他超出预期的东西
        console.error(errorInstance);
    }
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