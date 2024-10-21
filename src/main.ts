import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

type Point = { x: number, y: number };

interface DisplayCommand {
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

interface ToolCommand {
    draw(context: CanvasRenderingContext2D): void;
}

const emojis = ["🙂", "😞", "😠"];

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
let currentTool : "marker" | "sticker" = "marker";
let thickness = 1;
let cursorChar = "🙂";

const bus = new EventTarget();

function notify(name: string) {
    bus.dispatchEvent(new Event(name));
}

class LineCommand implements DisplayCommand {
    public points : Point[];
    constructor(public x: number, public y: number, public thickness: number) {
        this.points = [{ x, y }];
    }

    display(context: CanvasRenderingContext2D) {
        context.lineWidth = this.thickness;
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for (const point of this.points) {
            context.lineTo(point.x, point.y);
        }
        context.stroke();
    }

    drag(newX: number, newY: number) {
        this.points.push({ x: newX, y: newY });
    }
}

class StickerCommand implements DisplayCommand {
    public stickerPos : Point;
    constructor(public x: number, public y: number) {
        this.stickerPos = { x, y };
    }

    display(context: CanvasRenderingContext2D) {
        context.font = "24px monospace";
        context.fillText(cursorChar, this.x - 16, this.y + 8);
    }

    drag(newX: number, newY: number) {
        this.stickerPos = { x: newX, y: newY };
    }
}

function createDisplayCommand(x: number, y: number) : DisplayCommand {
    switch(currentTool) {
        case "marker": return new LineCommand(x, y, thickness);
        case "sticker": return new StickerCommand(x, y);
    }
}

class LinePreview implements ToolCommand {
    public radius: number = 5;
    constructor(public x: number, public y: number) {}

    draw(context: CanvasRenderingContext2D) {
        context.lineWidth = thickness;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        context.stroke();
    }
}

class StickerPreview implements ToolCommand {
    constructor(public x: number, public y: number) {}

    draw(context: CanvasRenderingContext2D) {
        context.font = "24px monospace";
        context.fillText(cursorChar, this.x - 16, this.y + 8);
    }
}

function createToolCommand(x: number, y: number) : ToolCommand {
    switch(currentTool) {
        case "marker": return new LinePreview(x, y);
        case "sticker": return new StickerPreview(x, y);
    }
}

const commandList : DisplayCommand[] = [];
const redoCommands : DisplayCommand[] = [];
let currentCommand : DisplayCommand;
let cursorCommand : ToolCommand | null;

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    redoCommands.splice(0, redoCommands.length);
    currentCommand = createDisplayCommand(cursor.x, cursor.y);
    commandList.push(currentCommand);
    cursorCommand = null;

    notify("drawing-changed");
})
canvas.addEventListener("mousemove", (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    if (cursor.active) {
        currentCommand.drag(cursor.x, cursor.y);
        notify("drawing-changed");
    } else {
        cursorCommand = createToolCommand(cursor.x, cursor.y);
        notify("tool-moved");
    }
})
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    cursorCommand = createToolCommand(cursor.x, cursor.y);
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

class StickerButton {
    button: HTMLButtonElement;
    constructor(public name: string) {
        this.button = document.createElement("button");
        this.button.innerHTML = `${this.name}`;
        this.button.addEventListener("click", () => {
            currentTool = "sticker";
            cursorChar = this.button.innerHTML;
            notify("tool-moved");
        });
        app.append(this.button);
    }
}

const stickers : StickerButton[] = [];
for (const emoji of emojis) {
    stickers.push(new StickerButton(emoji));
}

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

const thinTool = document.createElement("button");
thinTool.innerHTML = "thin";
thinTool.addEventListener("click", () => {
    thinTool.classList.add("toolActive");
    if (thickTool.classList.contains("toolActive"))
        thickTool.classList.remove("toolActive");
    thickness = 1;
    currentTool = "marker";
})
app.append(thinTool);

const thickTool = document.createElement("button");
thickTool.innerHTML = "thick";
thickTool.addEventListener("click", () => {
    thickTool.classList.add("toolActive");
    if (thinTool.classList.contains("toolActive"))
        thinTool.classList.remove("toolActive");
    thickness = 3;
    currentTool = "marker";
})
app.append(thickTool);
