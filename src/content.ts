/// <reference path="./dom.d.ts" />
async function inject() {
    const menuContainer = document.createElement("div");
    menuContainer.id = "kyouka-menu";
    const menuShadowRoot = menuContainer.attachShadow({ mode: "open" });
    const shadowRootScript = document.createElement("script");
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
        inject();
        return
    }
    const observer = new MutationObserver(() => {
        if (document.body) {
            observer.disconnect();
            inject();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}
function initDom(dom: Document) {
    //带自动获取版本号的标题
    {
        dom.getElementById("menuTitleBar")!.insertAdjacentText("afterbegin", `Kyouka-${chrome.runtime.getManifest().version}`);
    }
    // 注入js
    const root: HTMLDialogElement = dom.getElementById("root") as HTMLDialogElement;
    {
        dom.getElementById("execJavascriptByExtension")?.addEventListener("click", () => {
            if (!("showOpenFilePicker" in window)) {
                alert("当前浏览器不支持showOpenFilePicker")
                return
            }
            showOpenFilePicker().then(files => {
                const targetFile = files[0];
                if (!targetFile) return
                targetFile.getFile().then(fileInstance => {
                    fileInstance.text().then(code => {
                        chrome.runtime.sendMessage({
                            type: "execScript",
                            code
                        })
                    })
                })
            }).catch(() => { });
        });
    }
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
        })
    }
}
init();