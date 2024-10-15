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

const paths : Point[][] = [];
let currentPath : Point[] = [];

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    
    paths.push(currentPath);
    currentPath.push({ x: cursor.x, y: cursor.y });
    canvas.dispatchEvent(event);
})
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentPath?.push({ x: cursor.x, y: cursor.y });
        canvas.dispatchEvent(event);
    }
})
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentPath = [];
})
canvas.addEventListener("drawing-changed", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    for (const path of paths) {
        ctx?.beginPath();
        ctx?.moveTo(path[0].x, path[0].y);
        for (const point of path) {
            ctx?.lineTo(point.x, point.y);
        }
        ctx?.stroke();
    }
})

const clearButton = document.createElement("button");
clearButton.innerHTML = `clear`;
clearButton.addEventListener("click", () => {
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    paths.splice(0, paths.length);
})
app.append(clearButton);
