import { Hooker } from "../hook/hooker";
import { initConsoleDetectBypass } from "./tools/consoleDetectBypass";
import { type IpcObject, type ExtensionConfig } from '../types';
import { OriginObjects } from "../hook/originObjects";
import initBlockClipboardWrite from "./tools/blockClipboardWrite";
import initBlockConsoleOutput from "./tools/blockConsoleOutput";
import { processErrorEvent } from "./util";
import initBlockEvalExecute from "./tools/blockEvalExecute";
let config: ExtensionConfig | {} = {};
//提前hook部分可能用到的方法避免页面保存方法引用导致hook失效
function preHook() {
    Hooker.hookMethod(window.console, "table", "console.table", { id: "pre#console.table" });
    Hooker.hookMethod(window.console, "debug", "console.debug", { id: "pre#console.debug" });
    Hooker.hookMethod(window.console, "log", "console.log", { id: "pre#console.log" });
    Hooker.hookMethod(window.console, "info", "console.info", { id: "pre#console.info" });
    Hooker.hookMethod(window.console, "warn", "console.warn", { id: "pre#console.warn" });
    Hooker.hookMethod(window.console, "error", "console.error", { id: "pre#console.error" });
    Hooker.hookMethod(window.console, "dir", "console.dir", { id: "pre#console.dir" });
    Hooker.hookMethod(window.console, "dirxml", "console.dirxml", { id: "pre#console.dirxml" });
    Hooker.hookMethod(window.console, "clear", "console.clear", { id: "pre#console.clear" });
    Hooker.hookMethod(document, "execCommand", "document.execCommand", { id: "pre#document.execCommand" });
    Hooker.hookAsyncMethod(navigator.clipboard, "write", "navigator.clipboard.write", { id: "pre#navigator.clipboard.write" });
    Hooker.hookAsyncMethod(navigator.clipboard, "writeText", "navigator.clipboard.writeText", { id: "pre#navigator.clipboard.writeText" });
    Hooker.hookMethod(window, "eval", "window.eval", { id: "pre#window.eval" });
    //提前监听error
    window.addEventListener("error", (event) => processErrorEvent(config as ExtensionConfig, event));
    window.addEventListener("unhandledrejection", (event) => processErrorEvent(config as ExtensionConfig, event));
    window.addEventListener("rejectionhandled", (event) => processErrorEvent(config as ExtensionConfig, event));
}
async function init() {
    //等待ipc
    for (let index = 0; index < 250; index++) {
        if (!Reflect.has(window, "kyouka-ipc")) {
            await new Promise(resolve => setTimeout(resolve, 20));
            continue
        }
        break
    }
    const ipc = Reflect.get(window, "kyouka-ipc") as IpcObject;
    if (!ipc) {
        //已知bing首页会这样
        if (!location.href.includes("chrome/newtab")) {
            alert("Kyouka:获取IPC失败 部分功能不可用")
        }
        return
    }
    config = ipc.getConfig();
    //unmount ipc
    Reflect.deleteProperty(window, "kyouka-ipc");
    //利用自身来得早优势 将原始方法引用设置到window以便gui调用
    //不然gui就得吃已经挨过hook的函数了
    Reflect.defineProperty(window, "kyouka-backup-object", {
        enumerable: false,
        configurable: true,
        writable: false,
        value: OriginObjects
    });
    initConfig();

}
preHook();
init();
function initConfig() {
    if (Reflect.ownKeys(config).length === 0) {
        alert("Kyouka:读取配置失败 部分功能不可用")
        return
    }
    const typedConfig = config as ExtensionConfig;
    if (typedConfig.bypassConsoleDetect) {
        initConsoleDetectBypass();
    }
    if (typedConfig.blockClipboardWrite) {
        initBlockClipboardWrite();
    }
    if (typedConfig.blockConsole) {
        initBlockConsoleOutput();
    }
    if (typedConfig.blockError) {
        const eventHandlerDescriptor: PropertyDescriptor = {
            configurable: false,
            set() { },
            get() {
                return () => true
            }
        }
        Reflect.defineProperty(window, "onerror", eventHandlerDescriptor);
        Reflect.defineProperty(window, "onunhandledrejection", eventHandlerDescriptor);
        Reflect.defineProperty(window, "onrejectionhandled", eventHandlerDescriptor);
    }
    if (typedConfig.blockEval) {
        initBlockEvalExecute();
    }
}