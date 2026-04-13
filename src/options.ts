let audioContext = new AudioContext();
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
        defaultOption.textContent = "不设置";
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
            playButtonCheckChangeAudio(targetOptionKey!=="unset");
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
    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
    firstOscillator.start();
    lastOscillator.start(audioContext.currentTime + 0.08);
    firstOscillator.stop(audioContext.currentTime + 0.08);
    lastOscillator.stop(audioContext.currentTime + 0.16);
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
addEventListener("contextmenu", e => e.preventDefault())