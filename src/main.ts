import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

interface Point {
    x: number,
    y: number,
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

const event = new Event("drawing-changed");

let currentLine : Point[] = [];
const displayList : Point[][] = [];
const redoLines : Point[][] = [];

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    displayList.push(currentLine);
    currentLine.push({ x: cursor.x, y: cursor.y });
    canvas.dispatchEvent(event);
})
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentLine.push({ x: cursor.x, y: cursor.y });
        canvas.dispatchEvent(event);
    }
})
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = [];
})
canvas.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of displayList) {
        ctx?.beginPath();
        ctx?.moveTo(line[0].x, line[0].y);
        for (const point of line) ctx?.lineTo(point.x, point.y);
        ctx?.stroke();
    }
})

app.append(document.createElement("div"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    displayList.splice(0, displayList.length);
    redoLines.splice(0, redoLines.length);
})
app.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
    if (displayList.length > 0) {
        let undoLine = displayList.pop();
        if (undoLine) redoLines.push(undoLine);
    }
    canvas.dispatchEvent(event);
})
app.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
    if (redoLines.length > 0) {
        let redoLine = redoLines.pop();
        if (redoLine) displayList.push(redoLine);
    }
    canvas.dispatchEvent(event);
})
app.append(redoButton);
