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
            playButtonCheckChangeAudio();
        });
        this.append(checkboxElement, boxLabelElement);
        getChromeConfig<boolean>(targetSettingKey, false).then(result => {
            checkboxElement.checked = result;
        });
    }
}
async function playButtonCheckChangeAudio() {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 880;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.11);
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