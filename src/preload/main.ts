///<reference path="../dom.d.ts" />
import { type IpcObject, type ExtensionConfig } from '../types';
import { Hooker } from "js-hooker";
import { ToolManager } from "./manager/toolsManager";
import * as WorkerInjector from './workerInjector';
let config: ExtensionConfig | {} = {};
let workerPreloadScriptUrl: string | null = null;
const hooker = new Hooker();
const toolManager = new ToolManager(hooker);
const originObjectsRef = Hooker.getOriginReference();
async function init() {
    const originObjectsRef = Hooker.getOriginReference();
    //等待ipc
    for (let index = 0; index < 250; index++) {
        if (!Reflect.has(window, "kyouka-ipc")) {
            await new originObjectsRef.Promise(resolve => setTimeout(resolve, 20));
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
    workerPreloadScriptUrl = ipc.getWorkerPreloadUrl();
    //unmount ipc
    Reflect.deleteProperty(window, "kyouka-ipc");
    //利用自身来得早优势 将原始方法引用设置到window以便gui调用 不然gui就得吃已经挨过hook的函数了
    //检测gui是否启用
    if ((config as ExtensionConfig).enableGui) {
        Reflect.defineProperty(window, "kyouka-hooker", {
            value: hooker,
            writable: false,
            enumerable: false,
            configurable: true
        });
        Reflect.defineProperty(window, "kyouka-backup-object", {
            enumerable: false,
            configurable: true,
            writable: false,
            value: originObjectsRef
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
    if (workerPreloadScriptUrl && (config as ExtensionConfig).injectWorker) {
        WorkerInjector.init(hooker, workerPreloadScriptUrl, originObjectsRef, config as ExtensionConfig);
    }
}