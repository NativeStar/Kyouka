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
        dom.getElementById("exportStorageExtension")?.addEventListener("click", () => {
            if (!("showSaveFilePicker" in window)) {
                alert("当前浏览器不支持showSaveFilePicker")
                return
            }
            showSaveFilePicker({ suggestedName: `ExportStorage-${Date.now()}.csv` }).then(async (fd) => {
                try {
                    const writeStream = await fd.createWritable();
                    const cookieList = await chrome.runtime.sendMessage<any, chrome.cookies.Cookie[]>({ type: "getAllCookie" });
                    //cookie
                    writeStream.write("Cookie\nname,value,domain,path,expires,secure,httpOnly,sameSite,partitionKey")
                    if (cookieList === null) {
                        alert("无法获取Cookie列表!")
                        writeStream.close().catch(() => { });
                        return
                    }
                    const nowTimestamp = Date.now();
                    for (const cookieItem of cookieList) {
                        writeStream.write(`\n"${cookieItem.name}","${cookieItem.value}","${cookieItem.domain}","${cookieItem.path}",${cookieItem.expirationDate ? new Date(cookieItem.expirationDate + nowTimestamp).toLocaleString() : "Session"},${cookieItem.secure},${cookieItem.httpOnly},${cookieItem.sameSite},"${cookieItem.partitionKey ?? ""}"`)
                    }
                    //localStorage
                    writeStream.write("\n\nLocalStorage\nname,value");
                    for (const [name, value] of Object.entries(localStorage)) {
                        writeStream.write(`\n"${name}","${value}"`)
                    }
                    //sessionStorage
                    writeStream.write("\n\nSessionStorage\nname,value");
                    for (const [name, value] of Object.entries(sessionStorage)) {
                        writeStream.write(`\n"${name}","${value}"`)
                    }
                    //结束
                    await writeStream.close();
                    alert("导出完成");
                } catch (error) {
                    console.log(error);
                    alert("发生异常 详见控制台")
                }
            }).catch(() => { });
        });
    }
}
init();