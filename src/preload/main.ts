import { Hooker } from "../hook/hooker";
import { initConsoleDetectBypass } from "./tools/consoleDetectBypass";
import { type IpcObject ,type ExtensionConfig} from '../types';
let config:ExtensionConfig|{}={};
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
}
async function init() {
    //等待ipc
    for (let index = 0; index < 200; index++) {
        if (!Reflect.has(window, "kyouka-ipc")) {
            await new Promise(resolve => setTimeout(resolve, 15));
            continue
        }
        break
    }
    const ipc = Reflect.get(window, "kyouka-ipc") as IpcObject;
    if (!ipc) {
        //已知bing首页会这样
        if (!location.href.includes("chrome/newtab")) {
            alert("Kyouka:获取IPC失败 部分功能不可用")
            return
        }
    }
    //unmount ipc
    Reflect.deleteProperty(window, "kyouka-ipc");
    //TODO 备份各种原始函数并设置全局对象转给gui用 避免冲突
    config=ipc.getConfig();
    initConfig();

}
//preHook尽快调用
preHook();
init();
function initConfig(){
    if (Reflect.ownKeys(config).length===0) {
        alert("Kyouka:读取配置失败 部分功能不可用")
        return
    }
    const typedConfig=config as ExtensionConfig;
    if (typedConfig.bypassConsoleDetect) {
        initConsoleDetectBypass();
    }
}