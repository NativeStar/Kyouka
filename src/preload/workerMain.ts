///<reference path="../dom.d.ts" />
/// <reference lib="webworker" />
import { Hooker } from "js-hooker";
import { init as lexerInit, parse } from "es-module-lexer"
import { ToolManager } from "./manager/toolsManager";
const hooker = new Hooker();
async function messageProcessor(event: MessageEvent) {
    if (typeof event.data !== "object") {
        return
    }
    if (Reflect.has(event.data, "originUrl") && Reflect.has(event.data, "loadMode")) {
        removeEventListener("message", messageProcessor)
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
        new ToolManager(hooker).initWithConfig(event.data.config)
        if (event.data.workerType === "classic") {
            // 避免worker内部的importScripts跑偏
            hooker.hookMethod(globalThis, "importScripts", {
                beforeMethodInvoke: (args) => {
                    for (let i = 0; i < args.length; i++) {
                        // 将相对路径改为绝对路径
                        const currentUrl = args[i]
                        if (!currentUrl) {
                            continue
                        }
                        if (typeof currentUrl === "string") {
                            if (currentUrl.startsWith("http://") || currentUrl.startsWith("https://") || currentUrl.startsWith("blob:")) {
                                continue
                            }
                        }
                        args[i] = new URL(args[i]!, event.data.baseUrl).href;
                    }
                }
            })
        }
        if (event.data.workerType === "classic") {
            importScripts(event.data.originUrl)
            postMessage({ type: "kyouka-worker-origin-code-executed" })
        } else {
            // import是改不了的 只能静态替换了
            const codeUrl = await replaceEsModuleImport(event.data.originUrl, event.data.baseUrl)
            if (codeUrl) {
                await import(codeUrl)
                URL.revokeObjectURL(codeUrl)
                postMessage({ type: "kyouka-worker-origin-code-executed" })
            }
        }
    }
}
async function init() {
    addEventListener("message", messageProcessor);
    postMessage({ type: "kyouka-worker-hook-init" })
    console.log("worker preload init!");
}
async function replaceEsModuleImport(url: string, baseUrl: string): Promise<string | null> {
    try {
        await lexerInit()
        const response = await fetch(new URL(url, baseUrl).href)
        if (!response.ok) {
            return null
        }
        let codeString = await response.text()
        const [imports] = parse(codeString)
        const replacements: {
            start: number;
            end: number;
            text: string;
        }[] = [];
        for (const item of imports) {
            if (item.type === "import-meta") {
                continue;
            }
            if (item.type === "dynamic" && item.glob) {
                continue;
            }
            const specifier = item.specifier;
            if (!specifier) {
                continue;
            }
            if (!specifier.startsWith("./") && !specifier.startsWith("../") && !specifier.startsWith("/")) {
                continue;
            }
            const isDynamic = item.type === "dynamic";
            replacements.push({
                start: isDynamic ? item.start : item.start - 1,
                end: isDynamic ? item.end : item.end + 1,
                text: JSON.stringify(new URL(specifier, baseUrl).href),
            });
        }
        replacements.sort((a, b) => b.start - a.start);
        for (const { start, end, text } of replacements) {
            codeString = codeString.slice(0, start) + text + codeString.slice(end);
        }
        const codeBlob = new Blob([codeString], { type: "text/javascript" });
        return URL.createObjectURL(codeBlob)
    } catch (error) {
        console.error(error);
        return null
    }
}
init();