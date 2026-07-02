import { DefaultExtensionConfig, type ExtensionConfig } from "../types.js";
import { messageHandle, rightClickMenuHandle } from "./handle.js";
import { onSendMessageError, windowAlert } from "./util.js";
let config: ExtensionConfig | {} = {};
const guiContentScriptList: chrome.scripting.RegisteredContentScript[] = [
    {
        id: "guiScript",
        allFrames: false,
        matches: ["http://*/*", "https://*/*"],
        js: ["content.js"],
        runAt: "document_start"
    }
]
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
        //更新后会清空动态注册脚本 根据配置恢复注册
        if (mergedConfig.enableGui) {
            chrome.scripting.registerContentScripts(guiContentScriptList).catch(e => console.log(e))
        }
        try {
            mergedConfig.enableContextMenu ? setupContextMenu() : teardownContextMenu();
        } catch (error) {
            console.log(error)
        }
    }
});
//兜底 避免某些情况状态不一致
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(null).then(async (value) => {
        const mergedConfig = { ...DefaultExtensionConfig, ...value };
        const isRegisteredGuiScript = (await chrome.scripting.getRegisteredContentScripts({ ids: ["guiScript"] })).length > 0;
        if (mergedConfig.enableGui) {
            !isRegisteredGuiScript && chrome.scripting.registerContentScripts(guiContentScriptList).catch(e => console.log(e))
        } else {
            isRegisteredGuiScript && chrome.scripting.unregisterContentScripts({ ids: ["guiScript"] }).catch(e => console.log(e));
        }
        mergedConfig.enableContextMenu ? setupContextMenu() : teardownContextMenu();
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
    if (!(config as ExtensionConfig).enableGui) {
        tab.id && windowAlert(tab.id, "Kyouka:请在设置中开启注入GUI并刷新页面")
        return
    }
    chrome.tabs.sendMessage(tab.id!, { type: "openDialog" }).catch((err) => onSendMessageError(err, tab))
});
//快捷键
chrome.commands.onCommand.addListener(async (command, tab) => {
    if (!tab || tab.url?.startsWith("chrome://")) return
    if (Reflect.ownKeys(config).length === 0) {
        config = await chrome.storage.local.get(null);
    }
    if (!(config as ExtensionConfig).enableGui) {
        tab.id && windowAlert(tab.id, "Kyouka:请在设置中开启注入GUI并刷新页面")
        return
    }
    if (command === "openPanelHotkey") {
        chrome.tabs.sendMessage(tab.id!, { type: "openDialog" }).catch((err) => onSendMessageError(err, tab))
    } else if (command === "openWithResetPosition") {
        chrome.tabs.sendMessage(tab.id!, { type: "openWithResetPosition" }).catch((err) => onSendMessageError(err, tab))
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
    chrome.scripting.executeScript({
        target: {
            tabId: details.tabId
        },
        injectImmediately: true,
        world: chrome.scripting.ExecutionWorld.MAIN,
        func: (config: ExtensionConfig) => {
            Reflect.defineProperty(window, "kyouka-ipc", {
                enumerable: false,
                configurable: true,
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
        case "enableGui":
            //开关gui
            if (change.enableGui!.newValue as boolean) {
                chrome.scripting.registerContentScripts(guiContentScriptList).catch((e) => console.log(e));
            } else {
                chrome.scripting.unregisterContentScripts({ ids: ["guiScript"] }).catch(e => console.log(e));
            }
            break
        case "disableFont":
            //禁用字体
            const disableFont = change.disableFont!.newValue as boolean;
            chrome.declarativeNetRequest.updateEnabledRulesets({
                [disableFont ? "enableRulesetIds" : "disableRulesetIds"]: ["disableFont"]
            })
            break
        case "enableContextMenu":
            const newValue = change.enableContextMenu!.newValue as boolean;
            newValue ? setupContextMenu() : teardownContextMenu()
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
}
function teardownContextMenu() {
    chrome.contextMenus.removeAll();
}