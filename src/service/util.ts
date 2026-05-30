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