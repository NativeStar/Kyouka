let lastProgressToast: HTMLDialogElement | null = null;

export function showToast(text: string, time: number = 1500) {
    const toast = document.createElement("dialog");
    toast.style.fontFamily = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    toast.style.border = "none";
    toast.style.borderRadius = "9px";
    toast.style.outline = "none";
    toast.style.backgroundColor = "rgba(78, 47, 112, 0.82)";
    toast.style.color = "white";
    toast.style.position = "fixed";
    toast.style.top = "9%";
    toast.style.userSelect = "none";
    toast.style.zIndex = "9999999999999999999999";
    toast.innerText = text;
    document.body.appendChild(toast);
    toast.addEventListener("contextmenu", e => e.preventDefault());
    toast.show();
    setTimeout(() => {
        toast.close();
        toast.remove();
    }, time);
}
export function showProgressToast(text: string | null, show: boolean) {
    if (!show && lastProgressToast) {
        lastProgressToast.close();
        lastProgressToast.remove();
        lastProgressToast = null;
        return
    }
    const toast = document.createElement("dialog");
    toast.style.fontFamily = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    toast.style.border = "none";
    toast.style.borderRadius = "9px";
    toast.style.outline = "none";
    toast.style.backgroundColor = "rgba(78, 47, 112, 0.82)";
    toast.style.color = "white";
    toast.style.position = "fixed";
    toast.style.top = "9%";
    toast.style.userSelect = "none";
    toast.style.zIndex = "9999999999999999999999";
    toast.innerText = text ?? "";
    if (lastProgressToast) {
        lastProgressToast.close();
        lastProgressToast.remove();
    }
    lastProgressToast = toast;
    document.body.appendChild(toast);
    toast.addEventListener("contextmenu", e => e.preventDefault());
    toast.show();
}
export function parseFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`
    }
    const sizeKB = size / 1024;
    if (sizeKB < 1024) {
        return `${sizeKB.toFixed(2)} KB`
    }
    const sizeMB = sizeKB / 1024;
    if (sizeMB < 1024) {
        return `${sizeMB.toFixed(2)} MB`
    }
    const sizeGB = sizeMB / 1024;
    if (sizeGB < 1024) {
        return `${sizeGB.toFixed(2)} GB`
    }
    return `${(sizeGB / 1024).toFixed(2)} TB`
}
const windowsReservedFileNameRegex = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const windowsInvalidFileNameCharRegex = /[<>:"/\\|?*\u0000-\u001f]/g;
const windowsTrailingSpaceOrDotRegex = /[ .]+$/;
export function replaceWindowsFileNameInvalidChars(input: string, replacement: string = "-"): string {
    const sanitized = input
        .replace(windowsInvalidFileNameCharRegex, replacement)
        .replace(windowsTrailingSpaceOrDotRegex, match => replacement.repeat(match.length));
    return sanitized.replace(windowsReservedFileNameRegex, match => replacement.repeat(match.length));
}
