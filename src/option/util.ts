const audioContext = new AudioContext();
let tempedConfig: { [key: string]: string | boolean };
export async function playButtonCheckChangeAudio(isEnable: boolean) {
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
export async function getChromeConfig<T = any>(key: string, defaultValue: T): Promise<T> {
    const result = tempedConfig ?? await chrome.storage.local.get<{ [key: string]: boolean | string }>(key);
    //进行配置缓存
    if (!tempedConfig) tempedConfig = result;
    if (Reflect.has(result, key)) {
        return result[key] as T;
    } else {
        return defaultValue;
    }
}
export function showAlert(text: string) {
    document.getElementById("dialogText")!.innerText = text;
    (document.getElementById("dialogElement") as HTMLDialogElement).showModal()
}