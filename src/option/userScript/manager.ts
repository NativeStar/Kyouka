import type { UserScriptPersist } from "../../types";

export async function initUserScriptManagerUi() {
    chrome.storage.local.get(["userScripts"], result => {
        const userScripts = result.userScripts;
        console.log(userScripts);
        if (userScripts) {
            for (const userScript of (userScripts as UserScriptPersist[])) {
                const userScriptItem = document.createElement("user-script-item");
                userScriptItem.setAttribute("scriptName", userScript.name);
                userScriptItem.setAttribute("scriptVersion", userScript.versionName);
                userScriptItem.setAttribute("scriptDescription", userScript.description)
                userScriptItem.setAttribute("scriptId", userScript.id)
                document.getElementById("userScriptList")!.append(userScriptItem);
            }
        }
    })
}