import { Hooker } from "../hook/hooker";
import { OriginObjects } from "../hook/originObjects";
import { parseFileSize, replaceWindowsFileNameInvalidChars, showProgressToast, showToast } from "./util";
const shadowDomDiv = document.getElementById("kyouka-menu");
let recorder: MediaRecorder | null = null;
let originObjectReference: typeof OriginObjects = OriginObjects;
const successText = "执行成功";
const failedText = "执行失败";
const executedText = "该功能已执行过"
function wheelRemoveElementEventListener(event: MouseEvent) {
    if (event.button === 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        try {
            if (event.target instanceof HTMLElement) {
                // 不能移除自己
                if (event.target === shadowDomDiv) return
                if (event.target.tagName === "BODY" && event.target.parentElement?.tagName === "HTML") {
                    showToast("顶层元素无法删除")
                    return
                }
                event.target.remove();
            }
        } catch (error) {
            originObjectReference.console.warn("Error on remove element:", error);
            showToast("执行时发生异常 已尝试强制移除");
            (event.target as HTMLElement).remove();
        }
    }
}
function stopMediaRecorderKeyEventListener(event: KeyboardEvent) {
    if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        recorder?.stop();
    }
}
const toolState = {
    wheelRemoveElement: false
}
export async function waitOriginObject() {
    for (let index = 0; index < 200; index++) {
        if (!Reflect.has(window, "kyouka-backup-object")) {
            await new originObjectReference.Promise(resolve => setTimeout(resolve, 25));
            continue
        }
        break
    }
    const originObjects = Reflect.get(window, "kyouka-backup-object") as typeof OriginObjects;
    if (!originObjects) {
        if (!location.href.includes("chrome/newtab")) {
            showToast("获取原始对象引用失败 功能可能出现异常")
        }
        return
    }
    Hooker.setOriginObjectSource(originObjects);
    originObjectReference = originObjects;
    //unmount
    Reflect.deleteProperty(window, "kyouka-backup-object");
}
export const Tools: { [key: string]: () => void } = {
    "injectScript": () => {
        if (!("showOpenFilePicker" in window)) {
            showToast("浏览器不支持showOpenFilePicker")
            return
        }
        showOpenFilePicker().then(files => {
            files[0] && files[0].getFile().then(fileInstance => {
                const url = URL.createObjectURL(fileInstance);
                try {
                    const script = document.createElement("script");
                    script.src = url;
                    script.type = "module";
                    document.body.appendChild(script);
                } catch (e) {
                    alert("执行失败 详见控制台")
                    originObjectReference.console.log(e);
                } finally {
                    URL.revokeObjectURL(url);
                }
            })
        }).catch(() => { })
    },
    "controllableAllMedia": () => {
        let mediaList = [...document.querySelectorAll("video"), ...document.querySelectorAll("audio")]
        if (mediaList.length === 0) {
            showToast("未找到多媒体元素!")
            return
        }
        for (const element of mediaList) {
            element.controls = true;
            element.removeAttribute("controlslist");
            element.removeAttribute("disablepictureinpicture");
            element.removeAttribute("disableremoteplayback");
        }
        showToast(`已为${mediaList.length}个多媒体元素解除限制`, 2250)
    },
    "editPage": () => {
        const editable = document.body.hasAttribute("contenteditable");
        if (editable) {
            document.body.removeAttribute("contenteditable");
        } else {
            document.body.setAttribute("contenteditable", "");
        }
        showToast(`已${editable ? "退出" : "进入"}自由编辑`)
    },
    "enableAllElement": () => {
        const targetElements = document.querySelectorAll('[disabled]');
        //ant design
        const antDesignElements = document.querySelectorAll('.ant-input-disabled');
        if (targetElements.length === 0 && antDesignElements.length === 0) {
            showToast("未找到被停用的元素!")
            return
        }
        for (const element of targetElements) {
            element.removeAttribute('disabled')
        }
        for (const element of antDesignElements) {
            element.classList.remove('ant-input-disabled')
        }
        showToast(`重新启用了${targetElements.length}个元素`)
    },
    "removeInputLimit": () => {
        const allInputElements = document.querySelectorAll('input');
        const allTextareaElements = document.querySelectorAll('textarea');
        const allSelectElements = document.querySelectorAll('select');
        if (allInputElements.length === 0 && allTextareaElements.length === 0 && allSelectElements.length === 0) {
            showToast("未找到输入元素!")
            return
        }
        for (const element of allInputElements) {
            const inputType = element.getAttribute('type');
            switch (inputType) {
                case "file":
                    element.removeAttribute('accept');
                    break;
                case "date":
                case "month":
                case "week":
                case "time":
                case "datetime-local":
                case "number":
                case "range":
                    element.removeAttribute('min');
                    element.removeAttribute('max');
                    element.removeAttribute('step');
                    element.removeAttribute('readonly');
                    element.removeAttribute('required');
                    break
                case "text":
                case "search":
                case "url":
                case "tel":
                case "email":
                case "password":
                    element.removeAttribute('minlength');
                    element.removeAttribute('maxlength');
                    element.removeAttribute('pattern');
                    element.removeAttribute('readonly');
                    element.removeAttribute('required');
                    break;
                default:
                    break;
            }
        }
        for (const element of allTextareaElements) {
            element.removeAttribute('minlength');
            element.removeAttribute('maxlength');
            element.removeAttribute('readonly');
            element.removeAttribute('required');
        }
        for (const element of allSelectElements) {
            element.removeAttribute('required');
        }
        showToast(successText);
    },
    "showHiddenElements": () => {
        const hiddenElements = document.querySelectorAll('[hidden]');
        if (hiddenElements.length === 0) {
            showToast("未找到隐藏元素!")
            return
        }
        for (const element of hiddenElements) {
            element.removeAttribute('hidden')
        }
        showToast(`已显示${hiddenElements.length}个元素`);
    },
    "showDisplayNoneElements": () => {
        const confirmResult = confirm("此操作将遍历页面所有元素 可能造成卡死(取决于页面复杂度)\n确认继续?")
        if (!confirmResult) return
        const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
        for (const element of allElements) {
            // 忽略某些无意义元素 避免页面彻底混乱
            if (element.tagName === "LINK" || element.tagName === "SCRIPT" || element.tagName === "STYLE") {
                continue
            }
            if (getComputedStyle(element).display === "none") {
                element.style.display = "block";
            }
        }
        showToast(successText)
    },
    "forceTranslate": () => {
        const translateElements = document.querySelectorAll('[translate]');
        if (translateElements.length === 0) {
            showToast("未找到符合要求的元素!")
            return
        }
        for (const element of translateElements) {
            element.removeAttribute('translate')
        }
        showToast(`已对${translateElements.length}个元素强制启用翻译`);
    },
    "forcePropertyRW": () => {
        if (Hooker.isModifiedMethodOrObject(Object.defineProperty)) {
            return showToast(executedText)
        }
        const definePropertyHook = Hooker.hookMethod(Object, "defineProperty", "Object.defineProperty", {
            beforeMethodInvoke(args) {
                const [_target, _property, descriptor] = args as [object, PropertyKey, PropertyDescriptor];
                descriptor.writable = true;
                descriptor.configurable = true;
            },
        });
        const definePropertiesHook = Hooker.hookMethod(Object, "defineProperties", "Object.defineProperties", {
            beforeMethodInvoke(args) {
                const [_target, descriptors] = args as [object, PropertyDescriptorMap & ThisType<any>];
                for (const property in descriptors) {
                    descriptors[property]!.writable = true;
                    descriptors[property]!.configurable = true;
                }
            },
        });
        const reflectDefinePropertyHook = Hooker.hookMethod(Reflect, "defineProperty", "Reflect.defineProperty", {
            beforeMethodInvoke(args) {
                const [_target, _property, descriptor] = args as [object, PropertyKey, PropertyDescriptor];
                descriptor.writable = true;
                descriptor.configurable = true;
            },
        });
        showToast(definePropertiesHook && definePropertyHook && reflectDefinePropertyHook ? successText : failedText)
    },
    "wheelRemoveElement": () => {
        if (toolState.wheelRemoveElement) {
            document.removeEventListener("mousedown", wheelRemoveElementEventListener)
            toolState.wheelRemoveElement = false
        } else {
            document.addEventListener("mousedown", wheelRemoveElementEventListener)
            toolState.wheelRemoveElement = true
        }
        showToast(`已${toolState.wheelRemoveElement ? "开启" : "关闭"}中键移除元素`)
    },
    "playAudio": () => {
        if (!("showOpenFilePicker" in window)) {
            showToast("当前浏览器不支持showOpenFilePicker")
            return
        }
        showOpenFilePicker().then(files => {
            const targetFile = files[0];
            if (!targetFile) return
            targetFile.getFile().then(fileInstance => {
                try {
                    const blobUrl = URL.createObjectURL(fileInstance)
                    const audio = new Audio(blobUrl);
                    audio.addEventListener("error", (e) => {
                        alert("播放异常 可能是格式不支持")
                        originObjectReference.console.log(e);
                    })
                    audio.addEventListener("ended", () => {
                        requestIdleCallback(() => {
                            audio.remove();
                            URL.revokeObjectURL(blobUrl);
                        })
                    });
                    audio.play();
                    showToast(successText)
                } catch (error) {
                    showToast("播放异常 可能是格式不支持")
                    originObjectReference.console.log(error);
                }
            }).catch(() => { })
        })
    },
    "webBackground": () => {
        if (!("showOpenFilePicker" in window)) {
            showToast("当前浏览器不支持showOpenFilePicker")
            return
        }
        showOpenFilePicker().then(files => {
            const targetFile = files[0];
            if (!targetFile) return
            targetFile.getFile().then(fileInstance => {
                const url = URL.createObjectURL(fileInstance);
                try {
                    document.body.style.backgroundImage = `url(${url})`;
                    document.body.style.backgroundRepeat = "no-repeat";
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    showToast(successText);
                } catch (e) {
                    showToast("执行时发生异常 详见控制台")
                    originObjectReference.console.log(e);
                }
            })
        }).catch(() => { });
    },
    "openEyeDropper": () => {
        if ("EyeDropper" in window) {
            try {
                const dropper = new EyeDropper();
                dropper.open().then(res => {
                    if (confirm(`所选像素颜色值为:${res.sRGBHex}\n点击确定将复制到剪切板`)) {
                        originObjectReference.navigator.clipboard.writeText(res.sRGBHex);
                    }
                }).catch(() => { });
            } catch (error) {

            }
        } else {
            showToast("浏览器不支持EyeDropper API!");
        }
    },
    "forceOpenInNewTab": () => {
        const elements = document.querySelectorAll('a');
        if (elements.length === 0) {
            showToast("未找到链接元素!");
            return
        }
        for (const element of elements) {
            element.setAttribute('target', '_blank');
        }
        showToast(`修改了${elements.length}个元素`);
    },
    "becomeDocumentPictureInPicture": () => {
        if (!("documentPictureInPicture" in window)) {
            showToast("浏览器不支持文档画中画!");
            return
        }
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        }
        documentPictureInPicture.requestWindow({
            height: Math.floor(window.innerHeight / 2),
            width: Math.floor(window.innerWidth / 2),
        }).then(newWindow => {
            newWindow.document.head.innerHTML = document.head.innerHTML;
            newWindow.document.body.innerHTML = document.body.innerHTML;
            showToast("已切换")
        })
    },
    "logJsonOperation": () => {
        if (Hooker.isModifiedMethodOrObject(JSON?.stringify ?? {})) {
            return showToast(executedText)
        }
        const stringifyHook = Hooker.hookMethod<string>(window.JSON, "stringify", "window.JSON.stringify", {
            afterMethodInvoke(args) {
                originObjectReference.console.log("JSON Stringify:", args[0])
            },
        });
        const parseHook = Hooker.hookMethod<object>(window.JSON, "parse", "window.JSON.parse", {
            afterMethodInvoke(_args, tempMethodResult) {
                originObjectReference.console.log("JSON Parse:", tempMethodResult.current)
            },
        });
        const rawJsonHook = Hooker.hookMethod<object>(window.JSON, "rawJSON", "window.JSON.rawJSON", {
            afterMethodInvoke(_args, tempMethodResult) {
                originObjectReference.console.log("JSON Raw:", tempMethodResult.current)
            },
        });
        showToast(stringifyHook && parseHook && rawJsonHook ? successText : failedText)
    },
    "changePageIcon": () => {
        if (!("showOpenFilePicker" in window)) {
            showToast("当前浏览器不支持showOpenFilePicker")
            return
        }
        showOpenFilePicker().then(fileHandles => {
            fileHandles[0] && fileHandles[0].getFile().then(file => {
                file.arrayBuffer().then(buffer => {
                    const blob = new Blob([buffer], { type: "image/png" });
                    const url = URL.createObjectURL(blob);
                    const linkElement: HTMLLinkElement = document.querySelector("link[rel='icon']") as HTMLLinkElement;
                    if (linkElement) {
                        linkElement.href = url;
                    } else {
                        // 原本就没有标签 创建
                        const newLinkElement = document.createElement("link");
                        newLinkElement.rel = "icon";
                        newLinkElement.href = url;
                        document.head.appendChild(newLinkElement);
                    }
                    showToast(successText)
                })
            })

        })
    },
    "recordCanvas": () => {
        if (!("showSaveFilePicker" in window)) {
            showToast("当前浏览器不支持showSaveFilePicker")
            return
        }
        if (recorder) {
            if (confirm("停止正在进行的录制?")) {
                recorder?.stop();
            }
            return
        }
        const canvasElementList = document.querySelectorAll("canvas")
        if (canvasElementList.length === 0) {
            showToast("未找到canvas元素")
            return
        }
        if (canvasElementList.length > 1) {
            if (!confirm("找到多个canvas 将自动选择可见且尺寸最大的\n确认继续?")) {
                return
            }
        }
        let targetCanvas: HTMLCanvasElement | null = null
        for (const canvasElementItem of canvasElementList) {
            if (!targetCanvas) {
                targetCanvas = canvasElementItem
            }
            const targetCanvasVisibility = getComputedStyle(targetCanvas).display !== "none" && !targetCanvas.hidden;
            const newCanvasVisibility = getComputedStyle(canvasElementItem).display !== "none" && !canvasElementItem.hidden;
            const targetCanvasSize = canvasElementItem.width * canvasElementItem.height;
            const newCanvasSize = targetCanvas.width * targetCanvas.height;
            // 优先选择可见的
            if (!targetCanvasVisibility && newCanvasVisibility) {
                targetCanvas = canvasElementItem
                continue
            }
            //原先canvas可见的情况下 忽略一切不可见的
            if (!newCanvasVisibility && targetCanvasVisibility) {
                continue
            }
            //剩余情况 比大小
            if (newCanvasSize > targetCanvasSize) {
                targetCanvas = canvasElementItem
            }
        }
        if (!targetCanvas) {
            showToast("发生异常 请刷新页面重试")
            return
        }
        showSaveFilePicker({ suggestedName: `CanvasRecorder-${Date.now()}.webm` }).then(async (fd) => {
            const writeStream = await fd.createWritable();
            recorder = new MediaRecorder(targetCanvas.captureStream(60), { mimeType: "video/webm" });
            recorder.addEventListener("dataavailable", (event) => {
                writeStream.write(event.data);
            });
            recorder.addEventListener("stop", () => {
                writeStream.close();
                showToast("已停止录制");
                document.removeEventListener("keydown", stopMediaRecorderKeyEventListener);
                recorder = null;
            });
            document.addEventListener("keydown", stopMediaRecorderKeyEventListener);
            alert("使用Alt+P快捷键停止录制\n点击'确定'开始录制")
            recorder.start();
        }).catch(() => { })
    },
    "blockOpen": () => {
        if (Hooker.isModifiedMethodOrObject(window.open)) {
            return showToast(executedText)
        }
        const result = Hooker.hookMethod(window, "open", "window.open", {
            beforeMethodInvoke(_args, abortController) {
                showToast("已阻止一次open调用")
                abortController.abort();
            }
        });
        showToast(result ? successText : failedText)
    },
    "blockConsole": () => {
        //两个典型
        if (Hooker.isModifiedMethodOrObject(console.table) && Hooker.isModifiedMethodOrObject(console.log)) {
            return showToast(executedText)
        }
        function rejectAllInvoke(_args: any[], abortController: AbortController) {
            abortController.abort();
        }
        const tableHook = Hooker.hookMethod(console, "table", "console.table", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const debugHook = Hooker.hookMethod(console, "debug", "console.debug", {
            beforeMethodInvoke: rejectAllInvoke
        })
        const logHook = Hooker.hookMethod(console, "log", "console.log", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const infoHook = Hooker.hookMethod(console, "info", "console.info", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const warnHook = Hooker.hookMethod(console, "warn", "console.warn", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const errorHook = Hooker.hookMethod(console, "error", "console.error", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const dirHook = Hooker.hookMethod(console, "dir", "console.dir", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const dirxmlHook = Hooker.hookMethod(console, "dirxml", "console.dirxml", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const clearHook = Hooker.hookMethod(console, "clear", "console.clear", {
            beforeMethodInvoke: rejectAllInvoke
        });
        showToast(tableHook && debugHook && logHook && infoHook && warnHook && errorHook && dirHook && dirxmlHook && clearHook ? successText : failedText)
    },
    "blockSendBeacon": () => {
        if (Hooker.isModifiedMethodOrObject(navigator.sendBeacon)) {
            return showToast(executedText)
        }
        const result = Hooker.hookMethod(navigator, "sendBeacon", "navigator.sendBeacon", {
            beforeMethodInvoke(args, abortController) {
                // 顺便看看有多少网站用了这个API
                showToast("已阻止一次sendBeacon调用")
                originObjectReference.console.log(args)
                abortController.abort();
            }
        });
        showToast(result ? successText : failedText)
    },
    "forceRTL": () => {
        if (document.dir === "rtl") {
            document.dir = ""
        } else {
            document.dir = "rtl"
        }
        showToast(`已${document.dir === "rtl" ? "开启" : "关闭"}强制RTL`)
    },
    "changeTitle": () => {
        const newTitle = prompt("输入新标题", document.title);
        if (newTitle) {
            document.title = newTitle;
            showToast(successText)
        }
    },
    "disableSpellCheck": () => {
        const elements = document.querySelectorAll("[spellcheck]");
        if (elements.length === 0) {
            showToast("没有元素要求进行拼写检查")
            return
        }
        for (const element of elements) {
            element.removeAttribute("spellcheck");
        }
        showToast(`已移除${elements.length}个元素的拼写检查`)
    },
    "injectOnlineScript": () => {
        const url = prompt("输入目标脚本URL");
        if (!url) return;
        try {
            const script = document.createElement("script");
            script.src = url;
            script.type = "module";
            document.body.appendChild(script);
        } catch (error) {
            alert("执行失败 详见控制台")
            originObjectReference.console.log(error);
        }
    },
    "injectOnlineCss": () => {
        const url = prompt("输入目标文件URL");
        if (!url) return;
        try {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = url;
            document.head.appendChild(link);
        } catch (error) {
            alert("执行失败 详见控制台")
            originObjectReference.console.log(error);
        }
    },
    "changePageIconOnline": () => {
        const linkElement: HTMLLinkElement | null = document.querySelector("link[rel='icon']");;
        const url = prompt("输入目标图片URL", linkElement?.href ?? "");
        if (!url) return;
        if (linkElement) {
            linkElement.href = url;
        } else {
            // 原本就没有标签 创建
            const newLinkElement = document.createElement("link");
            newLinkElement.rel = "icon";
            newLinkElement.href = url;
            document.head.appendChild(newLinkElement);
        }
        showToast(successText)
    },
    "recordCanvasWithAudio": () => {
        if (!("showSaveFilePicker" in window)) {
            showToast("当前浏览器不支持showSaveFilePicker")
            return
        }
        if (recorder) {
            if (confirm("停止正在进行的录制?")) {
                recorder?.stop();
            }
            return
        }
        const canvasElementList = document.querySelectorAll("canvas")
        if (canvasElementList.length === 0) {
            showToast("未找到canvas元素")
            return
        }
        if (canvasElementList.length > 1) {
            if (!confirm("找到多个canvas 将自动选择可见且尺寸最大的\n确认继续?")) {
                return
            }
        }
        let targetCanvas: HTMLCanvasElement | null = null
        for (const canvasElementItem of canvasElementList) {
            if (!targetCanvas) {
                targetCanvas = canvasElementItem
            }
            const targetCanvasVisibility = getComputedStyle(targetCanvas).display !== "none" && !targetCanvas.hidden;
            const newCanvasVisibility = getComputedStyle(canvasElementItem).display !== "none" && !canvasElementItem.hidden;
            const targetCanvasSize = canvasElementItem.width * canvasElementItem.height;
            const newCanvasSize = targetCanvas.width * targetCanvas.height;
            // 优先选择可见的
            if (!targetCanvasVisibility && newCanvasVisibility) {
                targetCanvas = canvasElementItem
                continue
            }
            //原先canvas可见的情况下 忽略一切不可见的
            if (!newCanvasVisibility && targetCanvasVisibility) {
                continue
            }
            //剩余情况 比大小
            if (newCanvasSize > targetCanvasSize) {
                targetCanvas = canvasElementItem
            }
        }
        if (!targetCanvas) {
            showToast("发生异常 请刷新页面重试")
            return
        }
        showSaveFilePicker({ suggestedName: `CanvasRecorderWithAudio-${Date.now()}.webm` }).then(async (fd) => {
            const writeStream = await fd.createWritable();
            const canvasVideoStream = targetCanvas.captureStream(60);
            try {
                const audioStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
                const mixedStream = new MediaStream([
                    ...canvasVideoStream.getVideoTracks(),
                    ...audioStream.getAudioTracks(),
                ]);
                recorder = new MediaRecorder(mixedStream, { mimeType: "video/webm" })
                recorder.addEventListener("dataavailable", (event) => {
                    writeStream.write(event.data);
                });
                recorder.addEventListener("stop", () => {
                    writeStream.close();
                    audioStream.getTracks().forEach(track => track.stop());
                    mixedStream.getTracks().forEach(track => track.stop());
                    showToast("已停止录制");
                    document.removeEventListener("keydown", stopMediaRecorderKeyEventListener);
                    recorder = null;
                });
                document.addEventListener("keydown", stopMediaRecorderKeyEventListener);
                alert("使用Alt+P快捷键停止录制\n点击'确定'开始录制")
                recorder.start();
            } catch (error) {
                originObjectReference.console.log(error)
                showToast("用户未授权或发生异常\n由于API限制 请手动删除空录屏文件", 5000)
            }
        }).catch(() => { })
    },
    "removeWatermark": () => {
        const allElements = document.querySelectorAll('*') as NodeListOf<HTMLElement>;
        let removedElementCount = 0;
        for (const element of allElements) {
            const elementStyle = getComputedStyle(element);
            const zIndexNumber = parseInt(elementStyle.zIndex);
            //防止异常
            if (isNaN(zIndexNumber)) continue
            // 将所有忽略指针事件且带zIndex的元素判为水印
            if (elementStyle.pointerEvents === "none" && zIndexNumber > 1) {
                element.remove();
                removedElementCount++;
            }
        }
        showToast(removedElementCount === 0 ? "未找到符合条件的元素" : `已移除${removedElementCount}个元素`)
    },
    "removeWatermarkEnchant": () => {
        //hook append
        //确保没有hook相关方法
        if (!Hooker.isModifiedMethodOrObject(HTMLElement.prototype.append)) {
            const hookAppendResult = Hooker.hookMethod(HTMLElement.prototype, "append", "removeWatermarkEnchant", {
                beforeMethodInvoke(args, abortController) {
                    if (!(args[0] instanceof HTMLElement)) {
                        return
                    }
                    const element = args[0] as HTMLElement;
                    // 还没挂载到DOM 只能这样
                    const elementStyle = element.style;
                    const zIndexNumber = parseInt(elementStyle.zIndex);
                    //防止异常
                    if (isNaN(zIndexNumber)) return
                    if (elementStyle.pointerEvents === "none" && zIndexNumber > 1) {
                        element.remove();
                        abortController.abort();
                    }
                },
            });
            if (!hookAppendResult) {
                showToast("发生异常 请刷新页面重试")
                return
            }
        }
        //之后调用旧的移除水印即可
        Tools["removeWatermark"]!();
    },
    "copyPageIconUrl": () => {
        const linkElement: HTMLLinkElement = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (linkElement) {
            originObjectReference.navigator.clipboard.writeText(linkElement.href);
            showToast("已复制图标URL")
        } else {
            showToast("该网页未设置图标")
        }
    },
    "copyTitle": () => {
        originObjectReference.navigator.clipboard.writeText(document.title);
        showToast("已复制页面标题")
    },
    "dispatchLoadEvent": () => {
        window.dispatchEvent(new Event("load"));
        showToast("已分发load事件", 750)
    },
    "dispatchBeforeunloadEvent": () => {
        window.dispatchEvent(new Event("beforeunload"));
        // 缩短显示时间因为屏蔽sendBeacon的提示也可能弹出
        showToast("已分发beforeunload事件", 750)
    },
    "dispatchCustomEvent": () => {
        const eventName = prompt("请输入事件名", "pagehide");
        if (!eventName || eventName === "") return
        window.dispatchEvent(new CustomEvent(eventName));
        showToast(`分发自定义事件:${eventName}`, 750)
    },
    "closePageConfirm": () => {
        window.addEventListener("beforeunload", (event) => {
            event.preventDefault();
        });
        showToast(successText)
    },
    "logBase64Operation": () => {
        if (Hooker.isModifiedMethodOrObject(window.btoa ?? {})) {
            return showToast(executedText)
        }
        const atobHook = Hooker.hookMethod<any>(window, "atob", "window.atob", {
            afterMethodInvoke(_args, tempMethodResult) {
                originObjectReference.console.log("Base64 decode:", tempMethodResult.current)
            },
        });
        const parseHook = Hooker.hookMethod<string>(window, "btoa", "window.btoa", {
            afterMethodInvoke(args) {
                originObjectReference.console.log("Base64 encode:", args[0])
            },
        });
        showToast(atobHook && parseHook ? successText : failedText)
    },
    "pageInfo": async () => {
        showToast("统计中...")
        const scriptElementCount = document.querySelectorAll("script").length;
        const styleElementCount = document.querySelectorAll("style").length;
        const resourcesInfoList: PerformanceResourceTiming[] = performance.getEntriesByType("resource");
        const resCounts = {
            //css文件
            cssCount: 0,
            //由css引用的文件
            cssRefCount: 0,
            //js文件
            jsCount: 0,
            //音频
            audioCount: 0,
            //sendBeacon发送的数据
            beaconCount: 0,
            //网络请求
            networkCount: 0,
            //图片
            imgCount: 0,
            //视频
            videoCount: 0
        };
        for (const resInfo of resourcesInfoList) {
            switch (resInfo.initiatorType) {
                case "link":
                    if (resInfo.name.endsWith(".css")) {
                        resCounts.cssCount++;
                    }
                    break;
                case "css":
                    resCounts.cssRefCount++;
                    break;
                case "script":
                    resCounts.jsCount++;
                    break;
                case "audio":
                    resCounts.audioCount++;
                    break;
                case "beacon":
                    resCounts.beaconCount++;
                    break
                case "fetch":
                case "xmlhttprequest":
                    resCounts.networkCount++;
                    break;
                case "image":
                    resCounts.imgCount++;
                    break
                case "video":
                    resCounts.videoCount++;
                    break
                default:
                    break;
            }
        }
        const indexedDbCount = (await indexedDB.databases()).length;
        const cachesCount = (await caches.keys()).length;
        const storageBucketCount = (await (navigator.storageBuckets.keys())).length
        const cookieCount = (await cookieStore.getAll()).length
        const totalSize = (await navigator.storage.estimate()).usage ?? null
        alert(`数据准确度一般 仅供参考 部分项目仅计算从网络加载的内容数量
---- PAGE 1/2 ----
script元素数:${scriptElementCount} style元素数:${styleElementCount}
CSS文件:${resCounts.cssCount} CSS引用数据:${resCounts.cssRefCount} JavaScript文件:${resCounts.jsCount}
音频:${resCounts.audioCount} 图片:${resCounts.networkCount}\ 视频:${resCounts.videoCount}
其他网络请求:${resCounts.networkCount} 信标请求:${resCounts.beaconCount}`)
        alert(`---- PAGE 2/2 ----
本地存储条目:${localStorage.length} 会话存储条目:${sessionStorage.length}
IndexedDb数据库:${indexedDbCount} 缓存:${cachesCount}
Cookie(非HttpOnly):${cookieCount} 存储桶:${storageBucketCount}
资源总占用:${totalSize !== null ? parseFileSize(totalSize) : "由于未知原因 计算失败"}`)
    },
    "clientInfo": () => {
        alert(`V8堆占用:${parseFileSize(performance.memory.totalJSHeapSize)} V8堆上限:${parseFileSize(performance.memory.jsHeapSizeLimit)}
UserAgent:${navigator.userAgent}
语言:${navigator.language} 支持语言:${navigator.languages.length}
屏幕尺寸:${window.screen.width}x${window.screen.height}`)
    },
    "logRandomUuid": () => {
        if (Hooker.isModifiedMethodOrObject(crypto.randomUUID ?? {})) {
            return showToast(executedText)
        }
        Hooker.hookMethod<string>(crypto, "randomUUID", "crypto.randomUUID", {
            afterMethodInvoke(_args, tempMethodResult) {
                originObjectReference.console.log("生成UUID:", tempMethodResult.current)
            },
        });
        showToast(successText)
    },
    "dumpCache": async () => {
        if (!("showDirectoryPicker" in window)) {
            showToast("当前浏览器不支持showDirectoryPicker")
            return
        }
        const cacheKeys = await caches.keys()
        if (cacheKeys.length <= 0) {
            showToast("当前页面没有主动缓存数据")
            return
        }
        if (!confirm(`发现${cacheKeys.length}个缓存仓库 确认导出?`)) return
        let currentRepoIndex = 0;
        let currentCacheItemIndex = 0;
        showDirectoryPicker({ mode: "readwrite" }).then(async (fs) => {
            showToast("正在导出 请勿关闭页面...")
            try {
                const rootDirHandle = await fs.getDirectoryHandle(replaceWindowsFileNameInvalidChars(`CacheDump-${location.hostname}`), { create: true })
                for (const cacheRepoName of cacheKeys) {
                    currentRepoIndex++
                    const cacheRepoInstance = await caches.open(cacheRepoName);
                    const dirHandle = await rootDirHandle.getDirectoryHandle(replaceWindowsFileNameInvalidChars(`${location.hostname}/${cacheRepoName}`), { create: true })
                    const cacheFilesList = await cacheRepoInstance.keys();
                    for (const originCacheRequest of cacheFilesList) {
                        currentCacheItemIndex++
                        showProgressToast(`导出第${currentRepoIndex}/${cacheKeys.length}个仓库的第${currentCacheItemIndex}/${cacheFilesList.length}个文件`, true)
                        const cacheItemResponse = await cacheRepoInstance.match(originCacheRequest)!;
                        if (!cacheItemResponse) {
                            originObjectReference.console.log(`Missing cache data:${originCacheRequest.url}`);
                            continue
                        }
                        const url = new URL(originCacheRequest.url);
                        const targetFileHandle = await dirHandle.getFileHandle(`${Date.now()}-${replaceWindowsFileNameInvalidChars(url.pathname)}`, { create: true })
                        const targetFileOutputStream = await targetFileHandle.createWritable();
                        await cacheItemResponse.body?.pipeTo(targetFileOutputStream);
                    }
                }
                showProgressToast(null, false);
                showToast("导出完成");
            } catch (error) {
                showProgressToast(null, false);
                originObjectReference.console.error(error);
                showToast("导出失败 详见控制台")
            }
        }).catch(() => { })
    },
    "logCreateObjectURL": () => {
        if (Hooker.isModifiedMethodOrObject(URL.createObjectURL)) {
            return showToast(executedText)
        }
        const result = Hooker.hookMethod<string>(URL, "createObjectURL", "URL.createObjectURL", {
            afterMethodInvoke(_args, tempMethodResult) {
                originObjectReference.console.log("生成对象URL:", `'${tempMethodResult.current}'`)
            },
        });
        showToast(result ? successText : executedText)
    },
    "logPostMessage": () => {
        if (Hooker.isModifiedMethodOrObject(window.postMessage)) {
            return showToast(executedText)
        }
        const result = Hooker.hookMethod<void>(window, "postMessage", "window.postMessage", {
            afterMethodInvoke(args) {
                const arg0Data = args[0] instanceof Object ? JSON.stringify(args[0]) : args[0]
                originObjectReference.console.log(`推送消息:${arg0Data}\n目标:${args[1] ?? "unset"}`)
            },
        });
        showToast(result ? successText : executedText)
    },
    "logMathRandom": () => {
        if (Hooker.isModifiedMethodOrObject(Math.random)) {
            return showToast(executedText)
        }
        Hooker.hookMethod<number>(Math, "random", "Math.random", {
            afterMethodInvoke(_args, tempMethodResult) {
                originObjectReference.console.log("生成随机数:", tempMethodResult.current)
            },
        });
        showToast(successText)
    },
    "blockClose": () => {
        if (Hooker.isModifiedMethodOrObject(window.close)) {
            return showToast(executedText)
        }
        Hooker.hookMethod(window, "close", "window.close", {
            beforeMethodInvoke(_args, abortController) {
                showToast("阻止一次close调用", 800);
                abortController.abort();
            }
        });
        showToast(successText)
    },
    "removeElement": () => {
        const input = prompt("欲删除元素名 如input", "");
        if (!input) return
        for (const element of document.querySelectorAll(input)) {
            element.remove();
        }
        showToast(successText);
    },
    "speakText":()=>{
        if (!("SpeechSynthesisUtterance" in window)||!("speechSynthesis" in window)) {
            showToast("当前浏览器不支持文本转语音")
            return
        }
        const text=prompt("需要朗读的文本")
        if (!text) return
        const speech=new SpeechSynthesisUtterance(text);
        speech.lang="zh-CN";
        speechSynthesis.speak(speech);
        showToast(successText);
    },
    "blockShare":()=>{
        if (Hooker.isModifiedMethodOrObject(navigator.share)) {
            return showToast(executedText)
        }
        const result=Hooker.hookAsyncMethod(navigator, navigator.share, "navigator.share", {
            beforeMethodInvoke(_args, abortController) {
                showToast("阻止一次share调用", 800);
                abortController.abort();
            }
        });
        showToast(result ? successText : failedText)
    },
    "visitRobotsTxt":async ()=>{
        showToast("Loading...",350);
        try {
            const response=await fetch(`${location.origin}/robots.txt`);
            if (!response.ok) {
                showToast(response.status===404?"该网站无robots.txt文件":"由于未知原因 加载robots.txt失败");
                return
            }
            //小窗打开
            window.open(response.url,"_blank",`width=400,height=400,noopener,noreferrer`);
        } catch (error) {
            OriginObjects.console.error(error);
            showToast("加载robots.txt失败 详见控制台")
        }
    }
}