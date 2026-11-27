const extensionId = chrome.runtime.id
const wrapFunction = () => {
    return (() => {
        const Kyouka = {
            waitInitLooper: -1,
            getHooker: () => new Promise((resolve) => {
                const listener = (event: Event) => {
                    if ((event as CustomEvent).detail.type === "getHooker") {
                        document.removeEventListener("$extensionId$-response", listener)
                        resolve((event as CustomEvent).detail.result);
                    }
                }
                document.addEventListener("$extensionId$-response", listener)
                document.dispatchEvent(new CustomEvent("$extensionId$-userScriptEvent", { detail: { type: "getHooker" }, bubbles: false, cancelable: true, composed: false }));
            }),
            callTool: (toolName: string) => {
                document.dispatchEvent(new CustomEvent("$extensionId$-userScriptEvent", { detail: { type: "callTool", tool: toolName }, bubbles: false, cancelable: true, composed: false }));
            },
            waitRemoteInit: () => new Promise<void>((resolve) => {
                const listener = (event: Event) => {
                    if ((event as CustomEvent).detail.type === "waitRemoteInit") {
                        if (Kyouka.waitInitLooper !== -1) {
                            clearInterval(Kyouka.waitInitLooper);
                            Kyouka.waitInitLooper = -1;
                        }
                        document.removeEventListener("$extensionId$-response", listener)
                        resolve();
                    }
                }
                document.addEventListener("$extensionId$-response", listener)
                Kyouka.waitInitLooper = setInterval(() => {
                    document.dispatchEvent(new CustomEvent("$extensionId$-userScriptEvent", { detail: { type: "waitRemoteInit" }, bubbles: false, cancelable: true, composed: false }));
                }, 10);
            }),
        }
        "$@REPLACE@$"
    })();
}
export function wrapperUserScript(rawScript: string) {
    // 修复元数据的export
    rawScript = rawScript.replace("export const KyoukaScriptMetadata", "const KyoukaScriptMetadata");
    return `(${wrapFunction.toString()})()`.replaceAll("$extensionId$", extensionId).replace('"$@REPLACE@$"', rawScript);
}