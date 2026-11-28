import { getChromeConfig, playButtonCheckChangeAudio } from "../util"
export class OptionCheckBox extends HTMLElement {
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