import type { UserScriptPersist } from "../types";
import { parseRawUserScript } from "./userScript/parser"
import { wrapperUserScript } from "./userScript/wrapper";
const audioContext = new AudioContext();
let tempedConfig: { [key: string]: string | boolean };
class OptionCheckBox extends HTMLElement {
    constructor() {
        super();
        const targetSettingKey = this.getAttribute("settingKey")!;
        const checkboxElement = document.createElement("input");
        checkboxElement.type = "checkbox";
        checkboxElement.id = targetSettingKey!;
        const boxLabelElement = document.createElement("label");
        boxLabelElement.htmlFor = targetSettingKey!;
        boxLabelElement.textContent = this.getAttribute("description")!;
        checkboxElement.addEventListener("change", () => {
            chrome.storage.local.set({ [targetSettingKey]: checkboxElement.checked });
            playButtonCheckChangeAudio(checkboxElement.checked);
        });
        this.append(checkboxElement, boxLabelElement);
        getChromeConfig<boolean>(targetSettingKey, false).then(result => {
            checkboxElement.checked = result;
        });
    }
}
class OptionSelect extends HTMLElement {
    constructor() {
        super();
        const targetSettingKey = this.getAttribute("settingKey")!;
        const selectElement = document.createElement("select");
        selectElement.id = targetSettingKey!;
        const labelElement = document.createElement("label");
        labelElement.htmlFor = targetSettingKey!;
        labelElement.textContent = this.getAttribute("description")!;
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "关闭";
        defaultOption.setAttribute("optionValue", "unset");
        selectElement.append(defaultOption);
        const parsedOptions: string[] = JSON.parse(this.getAttribute("optionsList")!);
        for (const optionItem of parsedOptions) {
            const [optionItemKey, optionItemName] = optionItem.split(":") as [string, string];
            const optionElement = document.createElement("option");
            optionElement.textContent = optionItemName;
            optionElement.setAttribute("optionValue", optionItemKey);
            selectElement.append(optionElement);
        }
        selectElement.addEventListener("change", () => {
            const targetOption = selectElement.options[selectElement.selectedIndex]!;
            const targetOptionKey = targetOption.getAttribute("optionValue")!;
            chrome.storage.local.set({ [targetSettingKey]: targetOptionKey });
            playButtonCheckChangeAudio(targetOptionKey !== "unset");
        });
        this.append(labelElement, selectElement);
        getChromeConfig<string>(targetSettingKey, "unset").then(result => {
            parsedOptions.forEach(optionItem => {
                const [optionItemKey, optionItemName] = optionItem.split(":") as [string, string];
                if (optionItemKey === result) {
                    selectElement.value = optionItemName;
                }
            });
        });
    }
}
async function playButtonCheckChangeAudio(isEnable: boolean) {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    const firstOscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    firstOscillator.type = 'triangle';
    firstOscillator.frequency.value = isEnable ? 550 : 920;
    firstOscillator.connect(gainNode);
    const lastOscillator = audioContext.createOscillator();
    lastOscillator.type = 'triangle';
    lastOscillator.frequency.value = isEnable ? 920 : 550;
    lastOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    firstOscillator.start();
    lastOscillator.start(audioContext.currentTime + 0.1);
    firstOscillator.stop(audioContext.currentTime + 0.1);
    lastOscillator.stop(audioContext.currentTime + 0.2);
}
async function getChromeConfig<T = any>(key: string, defaultValue: T): Promise<T> {
    const result = tempedConfig ?? await chrome.storage.local.get<{ [key: string]: boolean | string }>(key);
    //进行配置缓存
    if (!tempedConfig) tempedConfig = result;
    if (Reflect.has(result, key)) {
        return result[key] as T;
    } else {
        return defaultValue;
    }
}
customElements.define("option-checkbox", OptionCheckBox);
customElements.define("option-select", OptionSelect);
// addEventListener("contextmenu", e => e.preventDefault())
document.getElementById("loadUserScript")?.addEventListener("click", async () => {
    if (!("showOpenFilePicker" in window)) {
        return alert("浏览器不支持showOpenFilePicker");
    }
    let registeredScripts: chrome.userScripts.RegisteredUserScript[] = [];
    try {
        registeredScripts = await chrome.userScripts.getScripts();
    } catch (error) {
        // TODO 换个方法提示 这鬼地方不允许alert
        return alert("请先启用用户脚本功能");
    }
    showOpenFilePicker().then(async (files) => {
        try {
            if (files.length !== 1) {
                return alert("请选择一个文件!");
            }
            const targetFile = files[0];
            if (!targetFile) return
            const file = await targetFile.getFile()
            const fileText = await file.text()
            const scriptMetadata = parseRawUserScript(fileText);
            if (!scriptMetadata) {
                return alert("所选脚本不是有效的Kyouka UserScript!\n详情请参考官网脚本模板");
            }
            const wrappedCode = wrapperUserScript(fileText);
            const { userScripts: userScriptsPersist = [] } = await chrome.storage.local.get("userScripts") as { userScripts: UserScriptPersist[] }
            const hasOldScript = registeredScripts.some(script => scriptMetadata.id === script.id)
            chrome.userScripts[hasOldScript ? "update" : "register"]([
                {
                    id: scriptMetadata.id,
                    matches: scriptMetadata.scope,
                    js: [{ code: wrappedCode }],
                    world: "MAIN",
                    runAt: "document_end"
                }
            ]);
            if (hasOldScript) {
                // 查找并更新现有持久化
                for (let i = 0; i < userScriptsPersist.length; i++) {
                    if (userScriptsPersist[i]?.id === scriptMetadata.id) {
                        userScriptsPersist[i] = { ...scriptMetadata, code: wrappedCode }
                        break
                    }
                }
            } else {
                userScriptsPersist.push({
                    ...scriptMetadata,
                    code: wrappedCode
                })
            }
            await chrome.storage.local.set({ userScripts: userScriptsPersist })
        } catch (error) {
            console.error(error);
            alert("导入用户脚本时发生异常");
        }
    })
})


// test
// parseRawUserScript(`
// export const KyoukaScriptMetadata={
//     name:"test name",
//     id:"test_id",
//     versionCode:0,
//     description:"test desc",
//     versionName:"0.0.1",
//     scope:[
//         "https://www.baidu.com",
//         "https://www.google.com"
//     ]
// }
// export const Test={
//     test:true
// }
// const a=1
// alert(a)
//     `)