import { DefaultExtensionConfig, type ExtensionConfig, languageLocations, type UserScriptPersist } from "../types.js";
import { messageHandle, rightClickMenuHandle } from "./handle.js";
import { sendDaemonEvent } from "./util.js";
let config: ExtensionConfig | {} = {};
// 消息事件
chrome.runtime.onMessage.addListener(messageHandle);
if (!chrome.contextMenus.onClicked.hasListener(rightClickMenuHandle)) {
    chrome.contextMenus.onClicked.addListener(rightClickMenuHandle);
}
//初始化配置
chrome.runtime.onInstalled.addListener(async (detail) => {
    if (detail.reason === "update" || detail.reason === "install") {
        const currentConfig: ExtensionConfig = await chrome.storage.local.get(null);
        const mergedConfig = { ...DefaultExtensionConfig, ...currentConfig };
        chrome.storage.local.set(mergedConfig);
        //保证同步
        updateAcceptLanguageRule(mergedConfig.changeLanguageLocation);
        const removeCsp = mergedConfig.removeCsp;
        chrome.declarativeNetRequest.updateEnabledRulesets({
            [removeCsp ? "enableRulesetIds" : "disableRulesetIds"]: ["removeCsp"]
        })
        try {
            mergedConfig.enableContextMenu ? setupContextMenu() : teardownContextMenu();
        } catch (error) {
            console.log(error)
        }
        ensureUserScripts();
    }
});
//兜底 避免某些情况状态不一致
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(null).then(async (value) => {
        const mergedConfig = { ...DefaultExtensionConfig, ...value };
        const isRegisteredGuiScript = (await chrome.scripting.getRegisteredContentScripts({ ids: ["guiScript"] })).length > 0;
        mergedConfig.enableContextMenu ? setupContextMenu() : teardownContextMenu();
        updateAcceptLanguageRule(mergedConfig.changeLanguageLocation)
        const removeCsp = mergedConfig.removeCsp;
        chrome.declarativeNetRequest.updateEnabledRulesets({
            [removeCsp ? "enableRulesetIds" : "disableRulesetIds"]: ["removeCsp"]
        });
        ensureUserScripts();
    });
});
// action
chrome.action.onClicked.addListener(async (tab) => {
    //chrome内部标签页无法访问
    //同时包括chrome://和chrome-extension://
    if (tab.url?.startsWith("chrome")) return
    if (Reflect.ownKeys(config).length === 0) {
        config = await chrome.storage.local.get(null);
    }
    sendDaemonEvent(tab.id!, "openDialog")
});
//快捷键
chrome.commands.onCommand.addListener(async (command, tab) => {
    if (!tab || tab.url?.startsWith("chrome://")) return
    if (Reflect.ownKeys(config).length === 0) {
        config = await chrome.storage.local.get(null);
    }
    if (command === "openPanelHotkey") {
        sendDaemonEvent(tab.id!, "openDialog")
    } else if (command === "openWithResetPosition") {
        sendDaemonEvent(tab.id!, "openWithResetPosition")
    }
});
//设置监听
chrome.storage.local.onChanged.addListener(change => {
    // 同步缓存配置
    chrome.storage.local.get<ExtensionConfig>(null).then(value => {
        config = value;
    });
    onSettingChange(change)
});
//为所有页面注入ipc
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0 || details.url.startsWith("chrome") || details.url === "about:blank") return
    // 如果配置为空 则加载
    if (Reflect.ownKeys(config).length === 0) {
        config = await chrome.storage.local.get(null);
    }
    const workerPreloadUrl = chrome.runtime.getURL("/preloadWorker.js")
    chrome.scripting.executeScript({
        target: {
            tabId: details.tabId
        },
        injectImmediately: true,
        world: chrome.scripting.ExecutionWorld.MAIN,
        func: (config: ExtensionConfig, preloadUrl: string) => {
            Reflect.defineProperty(window, "kyouka-ipc", {
                enumerable: false,
                configurable: true,
                writable: false,
                value: {
                    getConfig() {
                        return config;
                    },
                    getWorkerPreloadUrl() {
                        return preloadUrl
                    }
                }
            })
        },
        args: [config as ExtensionConfig, workerPreloadUrl]
    }).catch(e => console.log(e))
});
function onSettingChange(change: { [key: string]: chrome.storage.StorageChange; }) {
    const changeKey = Reflect.ownKeys(change)[0];
    switch (changeKey) {
        case "removeCsp":
            //移除csp
            const removeCsp = change.removeCsp!.newValue as boolean;
            chrome.declarativeNetRequest.updateEnabledRulesets({
                [removeCsp ? "enableRulesetIds" : "disableRulesetIds"]: ["removeCsp"]
            })
            break
        case "disableFont":
            //禁用字体
            const disableFont = change.disableFont!.newValue as boolean;
            chrome.declarativeNetRequest.updateEnabledRulesets({
                [disableFont ? "enableRulesetIds" : "disableRulesetIds"]: ["disableFont"]
            })
            break
        case "enableContextMenu":
            {
                const newValue = change.enableContextMenu!.newValue as boolean;
                newValue ? setupContextMenu() : teardownContextMenu()
                break
            }
        case "changeLanguageLocation":
            {
                const newValue = change.changeLanguageLocation!.newValue as string;
                updateAcceptLanguageRule(newValue);
                break
            }
    }
}
async function setupContextMenu() {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
        id: "openPanelMenuItem",
        title: "打开面板",
        contexts: ["all"],
    });
    chrome.contextMenus.create({
        id: "becomeFloatingWindowMenuItem",
        title: "转为小窗显示",
        contexts: ["all"],
    });
    chrome.contextMenus.create({
        id: "openLinkElementWithFloatingWindowMenuItem",
        title: "使用小窗打开",
        contexts: ["link"],
    });
    chrome.contextMenus.create({
        id: "openSelectedUrlWithFloatingWindowMenuItem",
        title: "使用小窗跳转(仅限链接)",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "calcTextCount",
        title: "选中字数统计",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "calcImageResolution",
        title: "获取图片分辨率",
        contexts: ["image"],
    });
    chrome.contextMenus.create({
        id: "speakSelectedText",
        title: "朗读选中文字",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "conversionTime",
        title: "转换时间格式",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "encodeBase64",
        title: "编码Base64",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "decodeBase64",
        title: "解码Base64",
        contexts: ["selection"]
    });
}
function teardownContextMenu() {
    chrome.contextMenus.removeAll();
}
async function updateAcceptLanguageRule(value: string | "unset") {
    if (value !== "unset" && !Reflect.has(languageLocations, value)) {
        console.warn(`Unsupported language location:${value}`);
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [886],
            addRules: []
        });
        return
    }
    const targetLanguageLocation = value === "unset" ? null : languageLocations[value]!;
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [886],
        addRules: value === "unset" ? [] : [{
            id: 886,
            priority: 100,
            action: {
                type: "modifyHeaders",
                requestHeaders: [{
                    header: "accept-language",
                    operation: "set",
                    value: targetLanguageLocation!.acceptLanguage,
                }],
            },
            condition: {
                regexFilter: "^https?://",
                resourceTypes: [
                    "main_frame",
                    "sub_frame",
                    "stylesheet",
                    "script",
                    "image",
                    "font",
                    "xmlhttprequest",
                    "ping",
                    "csp_report",
                    "media",
                    "websocket",
                    "other",
                ],
            },
        }],
    });
}
async function ensureUserScripts() {
    try {
        const currentScripts = await chrome.userScripts.getScripts()
        const { userScripts = [] } = await chrome.storage.local.get("userScripts") as { userScripts: UserScriptPersist[] }
        const registeredScripts = currentScripts.map(script => script.id)
        for (const script of userScripts) {
            if (!registeredScripts.includes(script.id)) {
                await chrome.userScripts.register([{
                    id: script.id,
                    world: "MAIN",
                    js: [{ code: script.code }],
                    matches: script.scope,
                    runAt: "document_end",
                }])
            }
        }
    } catch (error) {
        console.error(error);
    }
}