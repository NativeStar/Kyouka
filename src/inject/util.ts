let lastProgressToast: HTMLDialogElement | null = null;
let lastProgressToastParent: HTMLDivElement | null = null;
function appendToastStyle(dialog: HTMLDialogElement) {
    dialog.style.fontFamily = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
    dialog.style.border = "none";
    dialog.style.borderRadius = "9px";
    dialog.style.outline = "none";
    dialog.style.backgroundColor = "rgba(78, 47, 112, 0.82)";
    dialog.style.color = "white";
    dialog.style.position = "fixed";
    dialog.style.top = "9%";
    dialog.style.left = "50%";
    dialog.style.right = "auto";
    dialog.style.transform = "translateX(-50%)";
    dialog.style.margin = "0";
    dialog.style.width = "max-content";
    dialog.style.maxWidth = "calc(100vw - 2em)";
    dialog.style.padding = "0.55em 1em";
    dialog.style.boxSizing = "border-box";
    dialog.style.userSelect = "none";
    dialog.style.pointerEvents = "none";
    dialog.style.zIndex = "9999999999999999999999";
}
export function showToast(text: string, time: number = 1500) {
    const tempToastParent = document.createElement("div");
    const shadowRoot = tempToastParent.attachShadow({
        mode: "closed",
        clonable: false,
        delegatesFocus: false,
        serializable: false
    });
    const toast = document.createElement("dialog");
    appendToastStyle(toast);
    toast.innerText = text;
    shadowRoot.append(toast)
    document.body.appendChild(tempToastParent);
    toast.addEventListener("contextmenu", e => e.preventDefault());
    toast.show();
    setTimeout(() => {
        toast.close();
        toast.remove();
        tempToastParent.remove();
    }, time);
}
export function showProgressToast(text: string | null, show: boolean) {
    if (!show && lastProgressToast && lastProgressToastParent) {
        lastProgressToast.close();
        lastProgressToast.remove();
        lastProgressToast = null;
        lastProgressToastParent.remove();
        lastProgressToastParent = null;
        return
    }
    const tempToastParent = document.createElement("div");
    const shadowRoot = tempToastParent.attachShadow({
        mode: "closed",
        clonable: false,
        delegatesFocus: false,
        serializable: false
    });
    const toast = document.createElement("dialog");
    appendToastStyle(toast);
    toast.innerText = text ?? "";
    if (lastProgressToast && lastProgressToastParent) {
        lastProgressToast.close();
        lastProgressToast.remove();
        lastProgressToastParent.remove();
    }
    lastProgressToast = toast;
    lastProgressToastParent = tempToastParent;
    shadowRoot.append(toast)
    document.body.appendChild(tempToastParent);
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
export async function makeFileParentDir(root: FileSystemDirectoryHandle, path: string): Promise<{ directory: FileSystemDirectoryHandle; file: string; }> {
    const rawPaths = path.split("/");
    const pathLastElement = rawPaths[rawPaths.length - 1] ?? rawPaths[0];
    const paths = rawPaths.slice(0, -1);
    if (paths.length <= 1) {
        return { directory: root, file: pathLastElement! };
    }
    let lastDirectory = root;
    for (const path of paths) {
        if (path === "") continue;
        const filteredPath = replaceWindowsFileNameInvalidChars(path);
        const directory = await lastDirectory.getDirectoryHandle(filteredPath, { create: true });
        lastDirectory = directory;
    }
    return { directory: lastDirectory, file: pathLastElement! };
}
export function getWatermarkElements() {
    const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
    const tempWatermarkElementList: HTMLElement[] = [];
    for (const element of allElements) {
        const elementStyle = getComputedStyle(element);
        const zIndexNumber = parseInt(elementStyle.zIndex);
        //防止异常
        if (isNaN(zIndexNumber)) continue
        // 将所有忽略指针事件且带zIndex的元素判为水印
        if (elementStyle.pointerEvents === "none" && zIndexNumber > 1) {
            tempWatermarkElementList.push(element);
        }
    }
    return tempWatermarkElementList;
}
export function checkApiSupport(apiName: string) {
    if (apiName in window) {
        return true;
    }
    showToast(`当前浏览器不支持${apiName}`);
    return false;
}