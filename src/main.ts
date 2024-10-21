import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

type Point = { x: number, y: number };

interface DisplayCommand {
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

interface CursorCommand {
    draw(context: CanvasRenderingContext2D): void;
}

const appName = "An Ordinary Sketchpad";
document.title = appName;

const header = document.createElement("h1");
header.innerHTML = appName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.setAttribute("height", "256px");
canvas.setAttribute("width", "256px");
canvas.style.cursor = "none";
app.append(canvas);

const ctx = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };

let currentTool: "marker" | "sticker" = "marker";
let thickness = 1;
let cursorChar = "🙂";

const bus = new EventTarget();

function notify(name: string) {
    bus.dispatchEvent(new Event(name));
}

function createLine(x: number, y: number, width: number): DisplayCommand {
    const points: Point[] = [{ x, y }];

    return {
        display(context: CanvasRenderingContext2D) {
            context.lineWidth = width;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            for (const point of points) context.lineTo(point.x, point.y);
            context.stroke();
        },
        drag(newX: number, newY: number) {
            points.push({ x: newX, y: newY });
        }
    };
}

function createSticker(x: number, y: number, char: string): DisplayCommand {
    let stickerPos: Point = { x, y };
    let stickerChar = char;

    return {
        display(context: CanvasRenderingContext2D) {
            context.font = "24px monospace";
            context.fillText(stickerChar, stickerPos.x - 16, stickerPos.y + 8);
        },
        drag(newX: number, newY: number) {
            stickerPos = { x: newX, y: newY };
        }
    };
}

function createDisplayCommand(x: number, y: number): DisplayCommand {
    switch (currentTool) {
        case "marker": return createLine(x, y, thickness);
        case "sticker": return createSticker(x, y, cursorChar);
    }
}

function createLinePreview(x: number, y: number): CursorCommand {
    return {
        draw(context: CanvasRenderingContext2D) {
            context.lineWidth = thickness;
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2, true);
            context.stroke();
        }
    }
}

function createStickerPreview(x: number, y: number): CursorCommand {
    return {
        draw(context: CanvasRenderingContext2D) {
            context.font = "24px monospace";
            context.fillText(cursorChar, x - 16, y + 8);
        }
    };
}

function createCursorCommand(x: number, y: number): CursorCommand {
    switch (currentTool) {
        case "marker": return createLinePreview(x, y);
        case "sticker": return createStickerPreview(x, y);
    }
}

const commandList: DisplayCommand[] = [];
const redoCommands: DisplayCommand[] = [];
let displayCommand: DisplayCommand;
let cursorCommand: CursorCommand | null;

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    redoCommands.splice(0, redoCommands.length);
    displayCommand = createDisplayCommand(cursor.x, cursor.y);
    commandList.push(displayCommand);
    cursorCommand = null;

    notify("drawing-changed");
})
canvas.addEventListener("mousemove", (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    if (cursor.active) {
        displayCommand.drag(cursor.x, cursor.y);
        notify("drawing-changed");
    } else {
        cursorCommand = createCursorCommand(cursor.x, cursor.y);
        notify("tool-moved");
    }
})
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    cursorCommand = createCursorCommand(cursor.x, cursor.y);
    notify("tool-moved");
})
canvas.addEventListener("mouseout", () => {
    cursorCommand = null;
    notify("drawing-changed");
})

bus.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    commandList.forEach((command) => { if (ctx) command.display(ctx) });
})
bus.addEventListener("tool-moved", () => {
    notify("drawing-changed");
    if (cursorCommand) { if (ctx) cursorCommand.draw(ctx); }
})

app.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    commandList.splice(0, commandList.length);
    redoCommands.splice(0, redoCommands.length);
})
app.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
    if (commandList.length > 0) {
        let undoLine = commandList.pop();
        if (undoLine) redoCommands.push(undoLine);
    }
    notify("drawing-changed");
})
app.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
    if (redoCommands.length > 0) {
        let redoLine = redoCommands.pop();
        if (redoLine) commandList.push(redoLine);
    }
    notify("drawing-changed");
})
app.append(redoButton);

app.append(document.createElement("br"));

const tools: HTMLButtonElement[] = [];

function styleButton(button: HTMLButtonElement): void {
    for (const tool of tools)
        tool.classList.remove("toolActive");
    button.classList.add("toolActive");
}

function createMarkerButton(name: string, width: number): HTMLButtonElement {
    const marker = document.createElement("button");
    marker.innerHTML = `${name}`;
    marker.addEventListener("click", () => {
        styleButton(marker);
        currentTool = "marker";
        thickness = width;
    })
    app.append(marker);
    return marker;
}

function createStickerButton(icon: string): HTMLButtonElement {
    const sticker = document.createElement("button");
    sticker.innerHTML = `${icon}`;
    sticker.addEventListener("click", () => {
        styleButton(sticker);
        currentTool = "sticker";
        cursorChar = sticker.innerHTML;
        notify("tool-moved");
    });
    app.append(sticker);
    return sticker;
}

tools.push(createMarkerButton("thin", 1));
tools.push(createMarkerButton("thick", 3));

app.append(document.createElement("br"));

const addCustom = document.createElement("button");
addCustom.innerHTML = "Custom";
addCustom.addEventListener("click", () => {
    const text = prompt("Custom sticker text", "😐");
    if (text) tools.push(createStickerButton(text));
})
app.append(addCustom);

const emojis = ["🙂", "😞", "😠"];
for (const emoji of emojis) {
    tools.push(createStickerButton(emoji));
}
