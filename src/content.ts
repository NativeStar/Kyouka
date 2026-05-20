import type { SnapshotJson } from "./types"
async function injectGuiScript() {
    const menuContainer = document.createElement("div");
    menuContainer.id = "kyouka-menu";
    const menuShadowRoot = menuContainer.attachShadow({ mode: "open" });
    const shadowRootScript = document.createElement("script");
    shadowRootScript.charset = "utf-8";
    shadowRootScript.src = chrome.runtime.getURL("./inject.js");
    shadowRootScript.id = "injectScript"
    const menuHtml = await fetch(chrome.runtime.getURL("./menu.html")).then(res => res.text());
    const menuDocument = new DOMParser().parseFromString(menuHtml, "text/html");
    const menuCssLinkElement = document.createElement("link");
    menuCssLinkElement.rel = "stylesheet";
    menuCssLinkElement.href = chrome.runtime.getURL("./menu.css");
    menuDocument.head.appendChild(menuCssLinkElement);
    initDom(menuDocument);
    menuShadowRoot.append(shadowRootScript, menuDocument.head, menuDocument.body);
    document.body.appendChild(menuContainer);
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
function initDom(dom: Document) {
    //带自动获取版本号的标题
    {
        dom.getElementById("titleText")!.insertAdjacentText("afterbegin", `Kyouka-${chrome.runtime.getManifest().version}`);
    }
    const root: HTMLDialogElement = dom.getElementById("root") as HTMLDialogElement;
    //注入css
    {
        dom.getElementById("injectCssByExtension")?.addEventListener("click", () => {
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
        })
    }
    {
        //打开设置页
        dom.getElementById("openSettingPage")?.addEventListener("click", () => {
            chrome.runtime.sendMessage({ type: "openSettingPage" })
        })
    }
    {
        // action打开
        chrome.runtime.onMessage.addListener((message, sender) => {
            if (chrome.runtime.id !== sender.id) return
            if (message.type === "openDialog") {
                root.open ? root.close() : root.show();
            } else if (message.type === "openWithResetPosition") {
                root.style.top = "25%";
                root.style.left = "25%";
                root.open ? root.close() : root.show();
            }
        })
    }
    {
        //持久化cookie
        dom.getElementById("persistCookieByExtension")?.addEventListener("click", () => {
            chrome.runtime.sendMessage({
                type: "persistCookie"
            });
            alert("执行完成");
        });
    }
    {
        //导出存储
        dom.getElementById("siteDataSnapshot")?.addEventListener("click", async () => {
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
        });
        dom.getElementById("siteDataSnapshot")?.addEventListener("contextmenu", () => {
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
                            alert("导入完成")
                        } catch (error) {
                            alert("加载快照时发生异常 详见控制台")
                            console.error(error);
                        }
                    })
                })
            })
        })
    }
}
init();