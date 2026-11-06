const weeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function pad2(value: number) {
    return value.toString().padStart(2, "0");
}
// TODO 这里面的函数改成调用备份 因为他们可能在后期被调用
export function makeDateObjectToString(date: Date, localString: string) {
    if (Number.isNaN(date.getTime())) {
        return "Invalid Date";
    }
    const timezoneOffset = -date.getTimezoneOffset();
    const timezoneSign = timezoneOffset >= 0 ? "+" : "-";
    const timezoneAbsOffset = Math.abs(timezoneOffset);
    const timezoneHours = pad2(Math.floor(timezoneAbsOffset / 60));
    const timezoneMinutes = pad2(timezoneAbsOffset % 60);
    return `${weeks[date.getDay()]} ${months[date.getMonth()]} ${pad2(date.getDate())} ${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} GMT${timezoneSign}${timezoneHours}${timezoneMinutes} (${localString})`;
}

export function makeDateObjectToTimeString(date: Date, localString: string) {
    if (Number.isNaN(date.getTime())) {
        return "Invalid Date";
    }
    const timezoneOffset = -date.getTimezoneOffset();
    const timezoneSign = timezoneOffset >= 0 ? "+" : "-";
    const timezoneAbsOffset = Math.abs(timezoneOffset);
    const timezoneHours = pad2(Math.floor(timezoneAbsOffset / 60));
    const timezoneMinutes = pad2(timezoneAbsOffset % 60);
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} GMT${timezoneSign}${timezoneHours}${timezoneMinutes} (${localString})`;
}
// 应对Worker环境下没有document
export function getDocument() {
    if (Reflect.has(globalThis, "document")) {
        return Reflect.get(globalThis, "document");
    } else {
        return {};
    }
}
export function isRunningInWorker() {
    return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
}
export function getWorkerInjectBootstrapCode(workerType: WorkerType,preloadUrl:string) {
    if (workerType === "classic") {
        return `importScripts("${preloadUrl}");\n`;
    } else {
        return `import "${preloadUrl}"\n`
    }
}