///<reference path="../dom.d.ts" />
import { type IpcObject, type ExtensionConfig } from '../types';
import { OriginObjects } from "../hook/originObjects";
import { ToolManager } from "./manager/toolsManager";
let config: ExtensionConfig | {} = {};
const toolManager = new ToolManager();
async function init() {
    //等待ipc
    for (let index = 0; index < 250; index++) {
        if (!Reflect.has(window, "kyouka-ipc")) {
            await new OriginObjects.Promise(resolve => setTimeout(resolve, 20));
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
    //利用自身来得早优势 将原始方法引用设置到window以便gui调用 不然gui就得吃已经挨过hook的函数了
    //检测gui是否启用
    if ((config as ExtensionConfig).enableGui) {
        Reflect.defineProperty(window, "kyouka-backup-object", {
            enumerable: false,
            configurable: true,
            writable: false,
            value: OriginObjects
        });
    }
    initConfig();
}
init();
function initConfig() {
    if (Reflect.ownKeys(config).length === 0) {
        alert("Kyouka:读取配置失败 部分功能不可用")
        return
    }
    toolManager.initWithConfig(config as ExtensionConfig);
}