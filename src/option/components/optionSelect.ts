import { getChromeConfig, playButtonCheckChangeAudio } from "../util"
export class OptionSelect extends HTMLElement {
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