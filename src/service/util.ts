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