import type { UserScriptPersist } from "../../types";

export class UserScriptItem extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "row"
        const scriptName = this.getAttribute("scriptName")!;
        const scriptVersion = this.getAttribute("scriptVersion")!;
        const scriptDescription = this.getAttribute("scriptDescription")!;
        const scriptNameElement = document.createElement("span");
        const scriptDescriptionElement = document.createElement("span");
        scriptNameElement.textContent = `${scriptName} ${scriptVersion}`;
        scriptDescriptionElement.textContent = scriptDescription;
        scriptDescriptionElement.style.marginLeft = "1.5%"
        scriptNameElement.style.fontWeight = "bold";
        const unregisterButton = document.createElement("button");
        unregisterButton.textContent = "删除";
        unregisterButton.addEventListener("click", () => {
            this.unregisterSelfScript();
        });
        unregisterButton.style.marginLeft = "auto";
        container.style.margin = "0.5%";
        container.append(scriptNameElement, scriptDescriptionElement, unregisterButton);
        this.append(container);
    }
    private async unregisterSelfScript() {
        const scriptId = this.getAttribute("scriptId")!;
        chrome.userScripts.unregister({
            ids: [scriptId]
        })
        chrome.storage.local.get(["userScripts"], result => {
            const userScripts = result.userScripts;
            if (userScripts) {
                const newUserScripts = (userScripts as UserScriptPersist[]).filter(userScript => userScript.id !== scriptId);
                chrome.storage.local.set({ userScripts: newUserScripts });
            }
        })
        this.remove();
    }
}