import type { ExtensionConfig, PreHookOption } from "../../types";
import type { Hooker } from "js-hooker";
// 天知道为啥不把这个拆出来esbuild会崩
export abstract class AbstractTool {
    /**
     * 页面加载完成前执行
     */
    onPreload(): void { }
    /**
     *
     * 如果需要预hook函数 在此返回目标函数数据
     * @readonly
     * @type {PreHookOption[]}
     * @memberof AbstractTool
     */
    get preHookMethodList(): PreHookOption[] {
        return [];
    }
    /**
     * 当配置加载完成且工具被启用时执行
     * @param config 配置
     */
    abstract onMount(config: ExtensionConfig,hooker:Hooker): void
    /**
     * 预留 万一用得上
     */
    onUnmount(): void { }
}