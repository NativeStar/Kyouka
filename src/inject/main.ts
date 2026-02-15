import { Tools } from "./tools"
async function init() {
    const shadowDomDiv = document.getElementById("kyouka-menu");
    if (!shadowDomDiv) {
        alert("Failed to init menu!!!")
        return
    }
    const menuShadowRoot = shadowDomDiv.shadowRoot;
    if (!menuShadowRoot) {
        alert("Failed to init menu!!!")
        return
    }
    shadowDomDiv.removeAttribute("id");
    initDom(menuShadowRoot);
    menuShadowRoot.getElementById("injectScript")?.remove();
}
function initDom(shadow: ShadowRoot) {
    const titleBar = shadow.getElementById("menuTitleBar") as HTMLDivElement;
    const root = shadow.getElementById("root") as HTMLDialogElement;
    const tooltip = shadow.getElementById("tooltip") as HTMLSpanElement;
    // 阻止操作穿透
    {
        root.addEventListener("click", event => {
            event.stopPropagation();
            event.preventDefault();
        });
        root.addEventListener("pointerdown", event => {
            event.stopPropagation();
            event.preventDefault();
        });
    }
    //拖动
    {
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;
        titleBar.addEventListener("pointerdown", event => {
            event.stopPropagation();
            dragging = true;
            startX = event.clientX
            startY = event.clientY
            root.setPointerCapture(event.pointerId);
        });
        document.addEventListener("pointermove", event => {
            if (dragging) {
                event.preventDefault();
                event.stopPropagation();
                offsetX = startX - event.clientX;
                offsetY = startY - event.clientY;
                startX = event.clientX
                startY = event.clientY
                root.style.left = (root.offsetLeft - offsetX) + "px";
                root.style.top = (root.offsetTop - offsetY) + "px";
            }
        });
        document.addEventListener("pointerup", event => {
            event.stopPropagation();
            dragging = false;
            root.releasePointerCapture(event.pointerId);
        });
    }
    //关闭按钮
    {
        const closeButton = shadow.getElementById("closeButton") as HTMLButtonElement;
        closeButton.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            root.close();
        });
    }
    // 类型选择
    {
        const typeChangeButtons = root.getElementsByClassName("typeButton");
        const typedToolList = root.getElementsByClassName("toolList") as HTMLCollectionOf<HTMLDivElement>
        for (const typeChangeButton of typeChangeButtons) {
            typeChangeButton.addEventListener("click", (event) => {
                event.stopImmediatePropagation();
                const targetType = typeChangeButton.getAttribute("targetType")
                for (const tool of typedToolList) {
                    tool.style.display = tool.getAttribute("type") === targetType ? "flex" : "none";
                }
                for (const button of typeChangeButtons) {
                    button === typeChangeButton ? button.classList.add("typeSelected") : button.classList.remove("typeSelected");
                }
            })
        }
    }
    // 工具按钮
    {
        const toolButtons = root.getElementsByClassName("toolButton") as HTMLCollectionOf<HTMLButtonElement>
        for (const toolButton of toolButtons) {
            //执行
            toolButton.addEventListener("click", (event) => {
                event.stopPropagation();
                const toolName = toolButton.getAttribute("tool") ?? null;
                //由contentScript负责
                if (!toolName) return
                if (toolName in Tools) {
                    Tools[toolName]();
                }else{
                    alert(`Error: Tool not found:${toolName}`)
                }
            });
            // tooltip
            if (toolButton.hasAttribute("tooltip")) {
                toolButton.addEventListener("pointerenter", () => {
                    tooltip.hidden = false;
                    tooltip.textContent = toolButton.getAttribute("tooltip") ?? "";
                    // 换行
                    tooltip.innerHTML = tooltip.innerHTML.replaceAll("\\n", "<br/>");
                });
                toolButton.addEventListener("pointermove", (event) => {
                    tooltip.style.left = (event.clientX + 10) + "px";
                    tooltip.style.top = (event.clientY + 10) + "px";
                });
                toolButton.addEventListener("pointerleave", () => {
                    tooltip.hidden = true;
                })
            }
        }
    }
    //帮助按钮
    {
        const helpButtons = root.getElementsByClassName("helpButton") as HTMLCollectionOf<HTMLButtonElement>
        for (const button of helpButtons) {
                button.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const help = button.getAttribute("helpText");
                    if (!help) {
                        alert("Error: Help text not found")
                        return
                    }
                    alert(help.replaceAll("\\n", "\n"));
                });
        }
    }
    //禁用右键
    {
        root.addEventListener("contextmenu", event => {
            event.preventDefault();
            event.stopImmediatePropagation();
        });
    }
}
init();