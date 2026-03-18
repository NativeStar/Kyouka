let audioContext = new AudioContext();
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
async function playButtonCheckChangeAudio(isEnable:boolean) {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    const firstOscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    firstOscillator.type = 'triangle';
    firstOscillator.frequency.value = isEnable?550:920;
    firstOscillator.connect(gainNode);
    const lastOscillator = audioContext.createOscillator();
    lastOscillator.type = 'triangle';
    lastOscillator.frequency.value = isEnable?920:550;
    lastOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
    firstOscillator.start();
    lastOscillator.start(audioContext.currentTime + 0.08);
    firstOscillator.stop(audioContext.currentTime + 0.08);
    lastOscillator.stop(audioContext.currentTime + 0.16);
}
async function getChromeConfig<T = any>(key: string, defaultValue: T): Promise<T> {
    const result = await chrome.storage.local.get(key);
    if (Reflect.has(result, key)) {
        return result[key] as T;
    } else {
        return defaultValue;
    }
}
customElements.define("option-checkbox", OptionCheckBox);
addEventListener("contextmenu", e => e.preventDefault())