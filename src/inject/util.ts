import { OriginObjects } from "./hook/originObjects";

export function showToast(text: string, time: number = 1500) {
    const toast = document.createElement("dialog");
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
    toast.show();
    toast.addEventListener("contextmenu", e => e.preventDefault());
    setTimeout(() => {
        toast.close();
        toast.remove();
    }, time);
}
const leakedStackFeature = [
    "at Object.apply (<anonymous>:",
    "hookEntry (<anonymous>:",
    "at bypassToStringMethod.toString (<anonymous>:",
    "on proxy:",
    "Proxy.",
    "proxy",
    "at new Promise (<anonymous>)",
    "at <anonymous>:",
    "at Object.construct (<anonymous>:"
]
export function needDeleteStack(stack: string): boolean {
    for (const leakStr of leakedStackFeature) {
        if (OriginObjects.String.includes.call(stack, leakStr)) {
            return false;
        }
    }
    return true;
}
export function filterErrorStack(stack: string) {
    const splitStack = stack.split("\n");
    const filteredStack = splitStack.filter(line => needDeleteStack(line))
    return filteredStack.join("\n");
}

export function createBypassToStringMethod(methodName: string): () => string {
    const toString = function (this: any) {
        if (!(this instanceof Function)) {
            const error = new TypeError("Function.prototype.toString requires that 'this' be a Function");
            error.stack = filterErrorStack((error.stack) as string);
            throw error;
        }
        return `function ${methodName}() { [native code] }`;
    }
    toString.toString = getFakeNativeToString();
    toString.toString.toString = getFakeNativeToString();
    toString.prototype = void 0;
    toString.toString.prototype = void 0;
    return toString;
}
function getFakeNativeToString() {
    const toString = function (this: any) {
        if (!(this instanceof Function)) {
            const error = new OriginObjects.TypeError("Function.prototype.toString requires that 'this' be a Function");
            error.stack = filterErrorStack((error.stack) as string);
            throw error;
        }
        return "function toString() { [native code] }"
    };
    toString.toString = toString;
    toString.prototype = void 0;
    return toString;
}