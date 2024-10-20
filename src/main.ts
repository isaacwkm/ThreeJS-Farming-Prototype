import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

type Point = { x: number, y: number };

interface DisplayCommand {
    display(context: CanvasRenderingContext2D): void;
}

const appName = "An Ordinary Sketchpad";
document.title = appName;

const header = document.createElement("h1");
header.innerHTML = appName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.setAttribute("height", "256px");
canvas.setAttribute("width", "256px");
app.append(canvas);

const ctx = canvas.getContext("2d");
const cursor = { active: false, x: 0, y: 0 };
let thickness = 1;

const bus = new EventTarget();

function notify(name: string) {
    bus.dispatchEvent(new Event(name));
}

class LineCommand {
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
}

class ToolCommand {
    public radius = 5;
    constructor(public x: number, public y: number, public thickness: number) {}

    draw(context: CanvasRenderingContext2D) {
        context.lineWidth = this.thickness;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        context.stroke();
    }
}

const commandList : DisplayCommand[] = [];
const redoCommands : DisplayCommand[] = [];
let currentCommand : LineCommand;

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    redoCommands.splice(0, redoCommands.length);
    currentCommand = new LineCommand(cursor.x, cursor.y, thickness);
    commandList.push(currentCommand);
    notify("drawing-changed");
})
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentCommand.points.push({ x: cursor.x, y: cursor.y });
        notify("drawing-changed");
    }
})
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
})

bus.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    commandList.forEach((command) => { if (ctx) command.display(ctx) });
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

const thinTool = document.createElement("button");
thinTool.innerHTML = "thin";
thinTool.addEventListener("click", () => {
    thinTool.classList.add("toolActive");
    if (thickTool.classList.contains("toolActive"))
        thickTool.classList.remove("toolActive");
    thickness = 1;
})
app.append(thinTool);

const thickTool = document.createElement("button");
thickTool.innerHTML = "thick";
thickTool.addEventListener("click", () => {
    thickTool.classList.add("toolActive");
    if (thinTool.classList.contains("toolActive"))
        thinTool.classList.remove("toolActive");
    thickness = 3;
})
app.append(thickTool);
