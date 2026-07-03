import type { SnapshotJson } from "./types"
async function injectGuiScript() {
    const shadowRootScript = document.createElement("script");
    shadowRootScript.charset = "utf-8";
    shadowRootScript.src = chrome.runtime.getURL("./inject.js");
    shadowRootScript.setAttribute("extension-id", chrome.runtime.id);
    shadowRootScript.setAttribute("extension-version", chrome.runtime.getManifest().version);
    document.head.appendChild(shadowRootScript);
    initEventHandler();
}
function init() {
    if (document.body) {
        injectGuiScript();
        return
    }
    const observer = new MutationObserver(() => {
        if (document.body) {
            observer.disconnect();
            injectGuiScript();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}
function initEventHandler() {
    // 使用动态的扩展id作为事件名 避免被页面的自定义事件撞上
    document.addEventListener(`${chrome.runtime.id}-contentEvent`, async (e) => {
        if (!Reflect.has(e, "detail")) return;
        const detail: string = (e as CustomEvent).detail;
        switch (detail) {
            case "injectCssByExtension":
                if (!("showOpenFilePicker" in window)) {
                    alert("当前浏览器不支持showOpenFilePicker")
                    return
                }
                showOpenFilePicker().then(files => {
                    const targetFile = files[0];
                    if (!targetFile) return
                    targetFile.getFile().then(fileInstance => {
                        fileInstance.text().then(css => {
                            chrome.runtime.sendMessage({
                                type: "injectCss",
                                css
                            })
                        })
                    })
                }).catch(() => { });
                break;
            case "openSettingPage":
                chrome.runtime.sendMessage({ type: "openSettingPage" });
                break
            case "persistCookieByExtension":
                chrome.runtime.sendMessage({
                    type: "persistCookie"
                });
                alert("执行完成");
                break
            case "siteDataSnapshot":
                if (!("showSaveFilePicker" in window)) {
                    alert("当前浏览器不支持showSaveFilePicker")
                    return
                }
                if ((await indexedDB.databases()).length > 0) {
                    if (!confirm("该页面使用了IndexedDB保存数据 但扩展不支持处理此类数据 恢复后可能出现异常\n确定继续?")) return
                }
                //避免文件名出现Windows保留字
                const localTimeString = new Date().toLocaleString().replaceAll("/", "-").replaceAll(":", "-");
                const cookieList = await chrome.runtime.sendMessage<any, chrome.cookies.Cookie[]>({ type: "getAllCookie" });
                const localStorageEntries = Object.entries(localStorage);
                const sessionStorageEntries = Object.entries(sessionStorage);
                if (cookieList === null) {
                    alert("无法获取Cookie列表!")
                    return
                }
                if (cookieList.length === 0 && localStorageEntries.length === 0 && sessionStorageEntries.length === 0) {
                    alert("该网站未保存任何可导出数据!")
                    return
                }
                showSaveFilePicker({ suggestedName: `DataSnapshot-${location.host}_${localTimeString}.json` }).then(async (fd) => {
                    try {
                        const writeStream = await fd.createWritable();
                        //cookie
                        const tempObject: SnapshotJson = { metadata: { version: 1, host: location.host }, data: { cookie: [], localStorage: [], sessionStorage: [] } };
                        for (const cookieItem of cookieList) {
                            cookieItem.partitionKey
                            tempObject.data.cookie.push(cookieItem)
                        }
                        //localStorage
                        for (const [name, value] of localStorageEntries) {
                            tempObject.data.localStorage.push({
                                key: name,
                                value: value
                            })
                        }
                        //sessionStorage
                        for (const [name, value] of sessionStorageEntries) {
                            tempObject.data.sessionStorage.push({
                                key: name,
                                value: value
                            })
                        }
                        await writeStream.write(JSON.stringify(tempObject));
                        //结束
                        await writeStream.close();
                        alert("导出完成");
                    } catch (error) {
                        console.log(error);
                        alert("发生异常 详见控制台")
                    }
                }).catch(() => { });
                break
            case "sub:siteDataSnapshot":
                if (!("showOpenFilePicker" in window)) {
                    alert("当前浏览器不支持showOpenFilePicker");
                    return
                }
                showOpenFilePicker().then(files => {
                    const targetFile = files[0];
                    if (!targetFile) return
                    targetFile.getFile().then(fileInstance => {
                        fileInstance.text().then(async (json) => {
                            try {
                                const parsedJson = JSON.parse(json) as SnapshotJson;
                                //简单检查
                                if (!(parsedJson.data.cookie instanceof Array) || !(parsedJson.data.localStorage instanceof Array) || !(parsedJson.data.sessionStorage instanceof Array)) {
                                    alert("快照文件无效!");
                                    return
                                }
                                if (parsedJson.metadata.host !== location.host && !confirm(`快照文件网站和当前网站不一致 请确认文件选择是否正确\n快照网站:${parsedJson.metadata.host} 当前网站:${location.host}\n如果继续加载 Cookie可能出现问题(扩展会尝试修复 但不保证成功)\n确认继续?`)) return
                                if (!confirm("加载快照将清空当前数据 确定继续?")) return
                                //cookie
                                await chrome.runtime.sendMessage({
                                    type: "replaceCookie",
                                    data: parsedJson.data.cookie,
                                    domain: location.host
                                });
                                //localStorage
                                localStorage.clear();
                                for (const storageItem of parsedJson.data.localStorage) {
                                    localStorage.setItem(storageItem.key, storageItem.value)
                                }
                                //sessionStorage
                                sessionStorage.clear();
                                for (const storageItem of parsedJson.data.sessionStorage) {
                                    sessionStorage.setItem(storageItem.key, storageItem.value)
                                }
                                confirm("导入完成 建议立即刷新页面避免可能的异常\n是否立即刷新") && location.reload();
                            } catch (error) {
                                alert("加载快照时发生异常 详见控制台")
                                console.error(error);
                            }
                        })
                    })
                })
                break
            default:
                alert(`Unknown operation:${detail}`);
                break;
        }
    })
}
init();