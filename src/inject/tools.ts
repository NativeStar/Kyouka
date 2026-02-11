///<reference path="../dom.d.ts" />
import { Hooker } from "./hook/hooker";
import { OriginObjects } from "./hook/originObjects";
import { showToast } from "./util";
const shadowDomDiv = document.getElementById("kyouka-menu");
let recorder: MediaRecorder | null = null;
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
            OriginObjects.console.warn("Error on remove element:", error);
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
export const Tools: { [key: string]: () => void } = {
    "injectScript": () => {
        if (!("showOpenFilePicker" in window)) {
            showToast("当前浏览器不支持showOpenFilePicker")
            return
        }
        showOpenFilePicker().then(files => {
            files[0].getFile().then(fileInstance => {
                const url = URL.createObjectURL(fileInstance);
                try {
                    const script = document.createElement("script");
                    script.src = url;
                    script.type = "module";
                    document.body.appendChild(script);
                } catch (e) {
                    alert("执行失败 详见控制台")
                    OriginObjects.console.log(e);
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
        if (document.body.hasAttribute("contenteditable")) {
            document.body.removeAttribute("contenteditable");
            showToast("已退出自由编辑")
        } else {
            document.body.setAttribute("contenteditable", "");
            showToast("已进入自由编辑")
        }
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
        showToast(`执行完成`);
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
        showToast("操作完成")
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
    "blockEval": () => {
        if (Hooker.isModifiedMethodOrObject(eval)) {
            return showToast("该功能已执行过")
        }
        const result=Hooker.hookMethod(window, "eval", "window.eval", {
            beforeMethodInvoke(_args, abortController) {
                abortController.abort();
            },
        });
        showToast(result ? "执行成功" : "执行失败 详见控制台")
    },
    "forcePropertyRW": () => {
        if (Hooker.isModifiedMethodOrObject(Object.defineProperty)) {
            return showToast("该功能已执行过")
        }
        const definePropertyHook=Hooker.hookMethod(Object, "defineProperty", "Object.defineProperty", {
            beforeMethodInvoke(args) {
                const [_target, _property, descriptor] = args as [object, PropertyKey, PropertyDescriptor];
                descriptor.writable = true;
                descriptor.configurable = true;
            },
        });
        const definePropertiesHook=Hooker.hookMethod(Object, "defineProperties", "Object.defineProperties", {
            beforeMethodInvoke(args) {
                const [_target, descriptors] = args as [object, PropertyDescriptorMap & ThisType<any>];
                for (const property in descriptors) {
                    descriptors[property].writable = true;
                    descriptors[property].configurable = true;
                }
            },
        });
        const reflectDefinePropertyHook=Hooker.hookMethod(Reflect, "defineProperty", "Reflect.defineProperty", {
            beforeMethodInvoke(args) {
                const [_target, _property, descriptor] = args as [object, PropertyKey, PropertyDescriptor];
                descriptor.writable = true;
                descriptor.configurable = true;
            },
        });
        showToast(definePropertiesHook&&definePropertyHook&&reflectDefinePropertyHook?"执行成功":"执行失败 详见控制台")
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
                        OriginObjects.console.log(e);
                    })
                    audio.addEventListener("ended", () => {
                        requestIdleCallback(() => {
                            audio.remove();
                            URL.revokeObjectURL(blobUrl);
                        })
                    });
                    audio.play();
                    showToast("执行成功")
                } catch (error) {
                    showToast("播放异常 可能是格式不支持")
                    OriginObjects.console.log(error);
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
                    showToast("执行成功");
                } catch (e) {
                    showToast("执行时发生异常 详见控制台")
                    OriginObjects.console.log(e);
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
                        navigator.clipboard.writeText(res.sRGBHex);
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
        if (Hooker.isModifiedMethodOrObject(JSON?.stringify??{})) {
            return showToast("该功能已执行过")
        }
        const stringifyHook=Hooker.hookMethod<string>(window.JSON, "stringify", "window.JSON.stringify", {
            afterMethodInvoke(args) {
                OriginObjects.console.log("JSON Stringify:", args[0])
            },
        });
        const parseHook=Hooker.hookMethod<object>(window.JSON, "parse", "window.JSON.parse", {
            afterMethodInvoke(_args, tempMethodResult) {
                OriginObjects.console.log("JSON Parse:", tempMethodResult.current)
            },
        });
        showToast(stringifyHook&&parseHook?"执行成功":"执行失败 详见控制台")
    },
    "changePageIcon": () => {
        if (!("showOpenFilePicker" in window)) {
            showToast("当前浏览器不支持showOpenFilePicker")
            return
        }
        showOpenFilePicker().then(fileHandles => {
            fileHandles[0].getFile().then(file => {
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
                    showToast("执行成功")
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
            return showToast("该功能已执行过")
        }
        const result = Hooker.hookMethod(window, "open", "window.open", {
            beforeMethodInvoke(_args, abortController) {
                showToast("已阻止一次open调用")
                abortController.abort();
            }
        });
        showToast(result ? "执行成功" : "执行失败 详见控制台")
    },
    "blockConsole": () => {
        //两个典型
        if (Hooker.isModifiedMethodOrObject(console.table) && Hooker.isModifiedMethodOrObject(console.log)) {
            return showToast("该功能已执行过")
        }
        function rejectAllInvoke(_args: any[], abortController: AbortController) {
            abortController.abort();
        }
        const tableHook=Hooker.hookMethod(console, "table", "console.table", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const debugHook=Hooker.hookMethod(console, "debug", "console.debug", {
            beforeMethodInvoke: rejectAllInvoke
        })
        const logHook=Hooker.hookMethod(console, "log", "console.log", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const infoHook=Hooker.hookMethod(console, "info", "console.info", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const warnHook=Hooker.hookMethod(console, "warn", "console.warn", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const errorHook=Hooker.hookMethod(console, "error", "console.error", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const dirHook=Hooker.hookMethod(console, "dir", "console.dir", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const dirxmlHook=Hooker.hookMethod(console, "dirxml", "console.dirxml", {
            beforeMethodInvoke: rejectAllInvoke
        });
        const clearHook=Hooker.hookMethod(console, "clear", "console.clear", {
            beforeMethodInvoke: rejectAllInvoke
        });
        showToast(tableHook&&debugHook&&logHook&&infoHook&&warnHook&&errorHook&&dirHook&&dirxmlHook&&clearHook?"执行成功":"执行失败 详见控制台")
    },
    "blockSendBeacon": () => {
        if (Hooker.isModifiedMethodOrObject(navigator.sendBeacon)) {
            return showToast("该功能已执行过")
        }
        const result = Hooker.hookMethod(navigator, "sendBeacon", "navigator.sendBeacon", {
            beforeMethodInvoke(_args, abortController) {
                // 顺便看看有多少网站用了这个API
                showToast("已阻止一次sendBeacon调用")
                abortController.abort();
            }
        });
        showToast(result ? "执行成功" : "执行失败 详见控制台")
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
        const newTitle = prompt("输入新标题");
        if (newTitle) document.title = newTitle;
        showToast(newTitle ? "执行成功" : "操作被取消")
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
    "openRepository": () => {
        // 防止使用屏蔽open后把自己给坑了
        OriginObjects.open.call(window, "https://github.com/NativeStar/Kyouka")
    },
    "screenRecorder": () => {
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
        // 检查api支持
        showSaveFilePicker({ suggestedName: `ScreenRecorder-${Date.now()}.webm` }).then(async (fd) => {
            try {
                const displayMedia = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
                recorder = new MediaRecorder(displayMedia, { mimeType: "video/webm" });
                const writeStream = await fd.createWritable();
                recorder.addEventListener("dataavailable", (event) => {
                    writeStream.write(event.data);
                });
                recorder.addEventListener("stop", () => {
                    writeStream.close();
                    showToast("已停止录制")
                    displayMedia.getTracks().forEach(track => track.stop());
                    document.removeEventListener("keydown", stopMediaRecorderKeyEventListener);
                    recorder = null;
                });
                displayMedia.addEventListener("inactive", () => {
                    recorder?.stop();
                })
                document.addEventListener("keydown", stopMediaRecorderKeyEventListener);
                alert("使用Alt+P快捷键停止录制\n点击'确定'开始录制")
                recorder.start();
            } catch (error) {
                showToast("用户未授权或发生异常\n由于API限制 请手动删除空录屏文件", 5000)
            }
        }).catch(() => { })
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
            OriginObjects.console.log(error);
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
            OriginObjects.console.log(error);
        }
    },
    "changePageIconOnline": () => {
        const url = prompt("输入目标图片URL");
        if (!url) return;
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
        showToast("执行成功")
    }
}