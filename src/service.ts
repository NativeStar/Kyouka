type Message = {
    type: string
    [key: string]: any
}
// 消息事件
chrome.runtime.onMessage.addListener(async (msg: Message, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return;
    const tabId = sender.tab?.id;
    if (!tabId) return
    switch (msg.type) {
        case "execScript":
            chrome.scripting.executeScript({
                target: {
                    allFrames: true,
                    tabId
                },
                world: "MAIN",
                func: (code: string) => {
                    eval(code);
                },
                args: [msg.code]
            })
            break;
        case "injectCss":
            chrome.scripting.insertCSS({
                target: {
                    allFrames: true,
                    tabId
                },
                css: msg.css
            });
            break
        case "persistCookie":
            const expire = Math.floor(Date.now() / 1000) + 390 * 24 * 60 * 60;
            chrome.cookies.getAll({ session: false, url: sender.url}).then(cookies => {
                for (const cookieItem of cookies) {
                    const host = cookieItem.domain.startsWith(".") ? cookieItem.domain.slice(1) : cookieItem.domain;
                    const scheme = cookieItem.secure ? "https://" : "http://";
                    const url = scheme + host + (cookieItem.path || "/");
                    const newCookie: chrome.cookies.SetDetails = {
                        url,
                        name: cookieItem.name,
                        value: cookieItem.value,
                        path: cookieItem.path,
                        secure: cookieItem.secure,
                        httpOnly: cookieItem.httpOnly,
                        storeId: cookieItem.storeId,
                        expirationDate: expire,
                        partitionKey: cookieItem.partitionKey
                    }
                    if (!cookieItem.hostOnly) {
                        newCookie.domain = cookieItem.domain
                    }
                    chrome.cookies.set(newCookie);
                }
            })
            break
        default:
            break;
    }
});
// action
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id!, { type: "openDialog" })
});