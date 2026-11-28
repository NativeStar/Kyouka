import { OptionCheckBox } from "./optionCheckbox";
import type { UserScriptPersist } from "../../types";
import { OptionSelect } from "./optionSelect";
import { parseRawUserScript } from "../userScript/parser"
import { wrapperUserScript } from "../userScript/wrapper";
import { showAlert } from "../util";
export function initComponentsAndListeners() {
    customElements.define("option-checkbox", OptionCheckBox);
    customElements.define("option-select", OptionSelect);
    document.getElementById("optionModeButtonSettings")?.addEventListener("click", () => {
        document.getElementById('settingsList')!.style.display = 'flex';
        document.getElementById('userScriptList')!.style.display = 'none';
        document.getElementById("loadUserScript")!.hidden = true;
    });
    document.getElementById("optionModeButtonScript")?.addEventListener("click", () => {
        document.getElementById('settingsList')!.style.display = 'none';
        document.getElementById('userScriptList')!.style.display = 'flex';
        document.getElementById("loadUserScript")!.hidden = false;
    })
    document.getElementById("dialogCloseButton")?.addEventListener("click", () => {
        (document.getElementById("dialogElement") as HTMLDialogElement).close()
    });
    document.getElementById("loadUserScript")?.addEventListener("click", async () => {
        if (!("showOpenFilePicker" in window)) {
            return showAlert("浏览器不支持showOpenFilePicker");
        }
        let registeredScripts: chrome.userScripts.RegisteredUserScript[] = [];
        try {
            registeredScripts = await chrome.userScripts.getScripts();
        } catch (error) {
            return showAlert("请先启用用户脚本功能");
        }
        showOpenFilePicker().then(async (files) => {
            try {
                if (files.length !== 1) {
                    return showAlert("请选择一个文件!");
                }
                const targetFile = files[0];
                if (!targetFile) return
                const file = await targetFile.getFile()
                const fileText = await file.text()
                const scriptMetadata = parseRawUserScript(fileText);
                if (!scriptMetadata) {
                    return showAlert("所选脚本不是有效的Kyouka UserScript!\n详情请参考官网脚本模板");
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
                showAlert("导入用户脚本时发生异常");
            }
        })
    })
}