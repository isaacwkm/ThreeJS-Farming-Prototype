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
canvas.height = canvas.width = 256;
canvas.style.cursor = "none";
app.append(canvas);

const ctx = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };

let currentTool: "marker" | "sticker" = "marker";
let thickness = 2;
let cursorChar = "🙂";

const bus = new EventTarget();

type EventName = "drawing-changed" | "tool-moved";
function notify(name: EventName) {
    bus.dispatchEvent(new Event(name));
}

function createLine(x: number, y: number, width: number): DisplayCommand {
    const points: Point[] = [{ x, y }];
    let color = parseColor(parseInt(slider.value));

    return {
        display(context: CanvasRenderingContext2D) {
            context.strokeStyle = color;
            context.lineWidth = width;
            context.beginPath();
            context.moveTo(points[0].x, points[0].y);
            for (const point of points) context.lineTo(point.x, point.y);
            context.stroke();
        },
        drag(newX: number, newY: number) {
            points.push({ x: newX, y: newY });
        }
    }
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
    }
}

function createDisplayCommand(x: number, y: number): DisplayCommand {
    switch (currentTool) {
        case "marker": return createLine(x, y, thickness);
        case "sticker": return createSticker(x, y, cursorChar);
    }
}

function createLinePreview(x: number, y: number): CursorCommand {
    let color = parseColor(parseInt(slider.value));

    return {
        draw(context: CanvasRenderingContext2D) {
            context.strokeStyle = color;
            context.lineWidth = thickness;
            context.beginPath();
            context.arc(x, y, 6, 0, Math.PI * 2, true);
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
    }
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
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    commandList.forEach((command) => { if (ctx) command.display(ctx) });
})
bus.addEventListener("tool-moved", () => {
    notify("drawing-changed");
    if (cursorCommand) { if (ctx) cursorCommand.draw(ctx); }
})

app.append(document.createElement("br"));

function createButton(name: string, callback: () => void) {
    const button = document.createElement("button");
    button.innerHTML = name;
    button.addEventListener("click", () => callback());
    return button;
}

function clearCanvas() {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    commandList.splice(0, commandList.length);
    redoCommands.splice(0, redoCommands.length);
}
app.append(createButton("Clear", clearCanvas));

function undo() {
    if (commandList.length > 0) {
        let undoLine = commandList.pop();
        if (undoLine) redoCommands.push(undoLine);
    }
    notify("drawing-changed");
}
app.append(createButton("Undo", undo));

function redo() {
    if (redoCommands.length > 0) {
        let redoLine = redoCommands.pop();
        if (redoLine) commandList.push(redoLine);
    }
    notify("drawing-changed");
}
app.append(createButton("Redo", redo));

const toolDiv = document.createElement("div");
app.append(toolDiv);

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
    });
    toolDiv.append(marker);
    return marker;
}

function createStickerButton(icon: string): HTMLButtonElement {
    const sticker = document.createElement("button");
    sticker.innerHTML = `${icon}`;
    sticker.addEventListener("click", () => {
        styleButton(sticker);
        currentTool = "sticker";
        cursorChar = icon;
    });
    toolDiv.append(sticker);
    return sticker;
}

function makeLabel(name: string, appDiv: HTMLDivElement) {
    const label = document.createElement("label");
    label.innerHTML = `<b>${name} </b>`;
    appDiv.append(label);
}

makeLabel("Marker", toolDiv);

tools.push(createMarkerButton("thin", 2));
tools.push(createMarkerButton("thick", 4));

toolDiv.append(document.createElement("br"));

makeLabel("Sticker", toolDiv);

function addCustom() {
    const text = prompt("Custom sticker text", "😐");
    if (text) tools.push(createStickerButton(text));
}
toolDiv.append(createButton("Custom", addCustom));

const emojis = ["🙂", "😞", "😠"];
for (const emoji of emojis) {
    tools.push(createStickerButton(emoji));
}

makeLabel("Color", app);

function parseColor(sliderValue: number) : string {
    return `hsl(${sliderValue}, 100%, 50%)`;
}

const slider = document.createElement("input");
slider.type = "range";
slider.max = "300";
app.append(slider);

function exportImage() {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.height = tempCanvas.width = 1024;
    const context = tempCanvas.getContext("2d");
    if (context) context.scale(4, 4);
    commandList.forEach((command) => { if (context) command.display(context); });

    const anchor = document.createElement("a");
    anchor.href = tempCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
}
app.append(createButton("Export", exportImage));
