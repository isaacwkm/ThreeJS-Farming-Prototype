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

canvas.addEventListener("mousedown", (e) => {
    ctx?.beginPath();
    ctx?.moveTo(e.offsetX, e.offsetY);
})
canvas.addEventListener("mousemove", (e) => {
    ctx?.lineTo(e.offsetX, e.offsetY);
})
canvas.addEventListener("mouseup", (e) => {
    ctx?.lineTo(e.offsetX, e.offsetY);
    ctx?.stroke();
})
