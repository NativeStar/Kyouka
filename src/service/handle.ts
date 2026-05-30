import { onSendMessageError, windowAlert } from "./util";

type Message = {
    type: string
    [key: string]: any
}
export async function messageHandle(msg: Message, sender: chrome.runtime.MessageSender) {
    if (sender.id !== chrome.runtime.id) return;
    const tabId = sender.tab?.id;
    if (!tabId) return
    switch (msg.type) {
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
            chrome.cookies.getAll({ url: sender.url }).then(cookies => {
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
        case "replaceCookie":
            //清空现有cookie
            const newCookie: chrome.cookies.Cookie[] = msg.data;
            const callerDomain: string = msg.domain;
            const allCookies = await chrome.cookies.getAll({ url: sender.url });
            for (const cookieItem of allCookies) {
                const host = cookieItem.domain.startsWith(".")
                    ? cookieItem.domain.slice(1)
                    : cookieItem.domain;
                chrome.cookies.remove({
                    url: `${cookieItem.secure ? "https://" : "http://"}${host}${cookieItem.path}`,
                    name: cookieItem.name,
                    storeId: cookieItem.storeId,
                    partitionKey: cookieItem.partitionKey
                })
            }
            //放置cookie
            for (const cookieItem of newCookie) {
                let host = cookieItem.domain.startsWith(".")
                    ? cookieItem.domain.slice(1)
                    : cookieItem.domain;
                if (!host.includes(callerDomain)) {
                    host = callerDomain;
                }
                await chrome.cookies.set({
                    url: sender.url ?? `${cookieItem.secure ? "https://" : "http://"}${host}${cookieItem.path}`,
                    expirationDate: cookieItem.expirationDate,
                    httpOnly: cookieItem.httpOnly,
                    name: cookieItem.name,
                    path: cookieItem.path,
                    partitionKey: cookieItem.partitionKey,
                    sameSite: cookieItem.sameSite,
                    secure: cookieItem.secure,
                    storeId: cookieItem.storeId,
                    value: cookieItem.value
                })
            }
            break
        case "openSettingPage":
            chrome.runtime.openOptionsPage();
            break
        case "getAllCookie":
            return chrome.cookies.getAll({ url: sender.url })
        default:
            break;
    }
}
export async function rightClickMenuHandle(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    if (!tab || !tab.id) {
        return
    }
    switch (info.menuItemId) {
        case "openPanelMenuItem":
            chrome.tabs.sendMessage(tab.id, { type: "openDialog" }).catch((err) => onSendMessageError(err, tab))
            break
        case "becomeFloatingWindowMenuItem":
            chrome.windows.create({ url: info.pageUrl ?? tab.url, type: "popup", width: 500, height: 500 });
            chrome.tabs.remove(tab.id)
            break
        case "openLinkElementWithFloatingWindowMenuItem":
            chrome.windows.create({ url: info.linkUrl, type: "popup", width: 500, height: 500 });
            break
        case "openSelectedUrlWithFloatingWindowMenuItem":
            const selectedText = info.selectionText;
            if (!selectedText) return
            try {
                const urlInstance = new URL(selectedText);
                chrome.windows.create({ url: urlInstance.href, type: "popup", width: 500, height: 500 });
            } catch (error) {
                windowAlert(tab.id!, "无效URL!");
            }
            break
        case "calcTextCount":
            {
                const selectedText = info.selectionText;
                if (typeof selectedText !== "string") return;
                windowAlert(tab.id!, `选中文本数量:${selectedText.length}`);
            }
            break
        case "calcImageResolution":
            if (!info.srcUrl) {
                alert("无法打开图片!");
                return
            }
            try {
                const data = await (await fetch(info.srcUrl)).blob();
                const bitmap = await createImageBitmap(data);
                windowAlert(tab.id!, `图片分辨率:${bitmap.width}*${bitmap.height}`);
                bitmap.close();
            } catch (error) {
                windowAlert(tab.id!, `无法加载图片!\n${error}`);
            }
            break
        default:
            console.error(`Unknown context menu item id:${info.menuItemId}`);
            break;
    }
}