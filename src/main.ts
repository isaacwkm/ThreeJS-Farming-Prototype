import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

interface Point {
    x: number,
    y: number,
}

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

const bus = new EventTarget();

function notify(name: string) {
    bus.dispatchEvent(new Event(name));
}

class LineCommand implements DisplayCommand {
    public points : Point[];

    constructor(public x: number, public y: number) {
        this.points = [{ x, y }];
    }

    display(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for (const point of this.points) {
            context.lineTo(point.x, point.y);
        }
        context.stroke();
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
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
    currentCommand = new LineCommand(cursor.x, cursor.y);
    commandList.push(currentCommand);
    notify("drawing-changed");
})
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentCommand.drag(cursor.x, cursor.y);
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
app.append(thinTool);

const thickTool = document.createElement("button");
thickTool.innerHTML = "thick";
app.append(thickTool);
