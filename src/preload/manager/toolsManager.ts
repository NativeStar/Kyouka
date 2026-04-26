// import { Hooker } from "../../hook/hooker";
import { Hooker } from "js-hooker";
import { type PreHookOption, type ExtensionConfig } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
import { BlockClipboardWrite } from "../tools/blockClipboardWrite";
import { BlockConsoleOutput } from "../tools/blockConsoleOutput";
import { BlockError } from "../tools/blockError";
import { BlockStringCodeExecute } from "../tools/blockStringCodeExecute";
import { ConsoleDetectBypass } from "../tools/consoleDetectBypass";
import { PrintLogStack } from "../tools/printLogStack";
import { StringDetectBypass } from "../tools/stringDetectBypass";

export class ToolManager {
    private toolsConfigList = {
        bypassConsoleDetect: new ConsoleDetectBypass(),
        blockClipboardWrite: new BlockClipboardWrite(),
        blockConsole: new BlockConsoleOutput(),
        blockError: new BlockError(),
        blockStringCodeExecute: new BlockStringCodeExecute(),
        stringDetectBypass:new StringDetectBypass(),
        printStackInLogs:new PrintLogStack(),
    } as const;
    private preHooksMethodList: PreHookOption[];
    private hooker:Hooker=new Hooker();
    constructor() {
        const tools: AbstractTool[] = Object.values(this.toolsConfigList);
        this.preHooksMethodList = tools.flatMap(toolInstance => toolInstance.preHookMethodList);
        //preHook
        //避免重复hook
        const hookedIds = new Set<string>();
        for (const preHookOption of this.preHooksMethodList) {
            if (hookedIds.has(preHookOption.id)) continue;
            if (preHookOption.useAsyncHook) {
                this.hooker.hookAsyncMethod(preHookOption.parent, preHookOption.methodName, { id: preHookOption.id })
            }else{
                this.hooker.hookMethod(preHookOption.parent, preHookOption.methodName, { id: preHookOption.id })
            }
            hookedIds.add(preHookOption.id);
        }
        //执行自定义preload
        for (const toolInstance of tools) {
            toolInstance.onPreload();
        }
    }
    initWithConfig(config: ExtensionConfig) {
        const toolKeys = Object.keys(this.toolsConfigList) as (keyof typeof this.toolsConfigList)[];
        for (const key of toolKeys) {
            // 初始化工具
            if (config[key]) {
                this.toolsConfigList[key].onMount(config as never,this.hooker);
            }
        }
        //释放占位hook
        for (const preHookInstance of this.preHooksMethodList) {
            this.hooker.unhook(preHookInstance.type, preHookInstance.parent, preHookInstance.methodName, preHookInstance.id);
        }
    }
}