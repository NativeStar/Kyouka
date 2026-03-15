import { DefaultExtensionConfig, type ExtensionConfig } from "./types.js";
type Message = {
    type: string
    [key: string]: any
}
let config: ExtensionConfig | {} = {};
// 消息事件
chrome.runtime.onMessage.addListener(async (msg: Message, sender) => {
    if (sender.id !== chrome.runtime.id) return;
    const tabId = sender.tab?.id;
    if (!tabId) return
    switch (msg.type) {
        case "execScript":
            chrome.scripting.executeScript({
                target: {
                    tabId
                },
                world: chrome.scripting.ExecutionWorld.MAIN,
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
            chrome.cookies.getAll({ session: false, url: sender.url }).then(cookies => {
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
        case "openSettingPage":
            chrome.runtime.openOptionsPage();
            break
        default:
            break;
    }
});
//初始化配置
chrome.runtime.onInstalled.addListener(async (detail) => {
    if (detail.reason === "update" || detail.reason === "install") {
        const currentConfig: ExtensionConfig = await chrome.storage.local.get(null);
        chrome.storage.local.set({ ...DefaultExtensionConfig, ...currentConfig });
    }
});
// action
chrome.action.onClicked.addListener((tab) => {
    //chrome内部标签页无法访问
    //同时包括chrome://和chrome-extension://
    if (tab.url?.startsWith("chrome")) return
    chrome.tabs.sendMessage(tab.id!, { type: "openDialog" }).catch((err) => onSendMessageError(err, tab))
});
//快捷键
chrome.commands.onCommand.addListener((command, tab) => {
    if (!tab || tab.url?.startsWith("chrome://")) return
    if (command === "openPanelHotkey") {
        chrome.tabs.sendMessage(tab.id!, { type: "openDialog" }).catch((err) => onSendMessageError(err, tab))
    } else if (command === "openWithResetPosition") {
        chrome.tabs.sendMessage(tab.id!, { type: "openWithResetPosition" }).catch((err) => onSendMessageError(err, tab))
    }
});
function onSendMessageError(errorInstance: Error, currentTab: chrome.tabs.Tab) {
    if (errorInstance instanceof Error && errorInstance.message === "Could not establish connection. Receiving end does not exist.") {
        const tabId = currentTab.id;
        if (!tabId) return
        chrome.scripting.executeScript({
            target: {
                tabId
            },
            func: () => {
                if (window.confirm("扩展已更新 需刷新页面才能生效\n点击'确定'将执行刷新")) window.location.reload()
            }
        }).catch(e=>console.log(e))
    } else {
        //其他超出预期的东西
        console.error(errorInstance);
    }
}
//设置监听
chrome.storage.local.onChanged.addListener(change => {
    // 同步缓存配置
    chrome.storage.local.get<ExtensionConfig>(null).then(value => {
        config = value;
    })
    //移除csp
    if (Reflect.has(change, "removeCsp")) {
        const removeCsp = change.removeCsp!.newValue as boolean;
        chrome.declarativeNetRequest.updateEnabledRulesets({
            [removeCsp?"enableRulesetIds": "disableRulesetIds"]:["removeCsp"]
        })
    }
});
//为所有页面注入ipc
chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
    if (!tab.url || tab.url.startsWith("chrome") || change.status !== "loading") return
    // 如果配置为空 则加载
    if (Reflect.ownKeys(config).length === 0) {
        config = await chrome.storage.local.get(null);
    }
    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        world: chrome.scripting.ExecutionWorld.MAIN,
        func: (config: ExtensionConfig) => {
            Reflect.defineProperty(window, "kyouka-ipc", {
                enumerable: false,
                configurable:true,
                writable: false,
                value: {
                    getConfig() {
                        return config;
                    }
                }
            })
        },
        args: [config as ExtensionConfig]
    }).catch(e => console.log(e))
})