import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

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

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
})
canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        ctx?.beginPath();
        ctx?.moveTo(cursor.x, cursor.y);
        ctx?.lineTo(e.offsetX, e.offsetY);
        ctx?.stroke();

        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
})
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
})

const clearButton = document.createElement("button");
clearButton.innerHTML = `clear`;
clearButton.addEventListener("click", () => ctx?.clearRect(0, 0, 256, 256));
app.append(clearButton);