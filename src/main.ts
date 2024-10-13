import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const appName = "An Ordinary Sketchpad";
document.title = appName;

const header = document.createElement("h1");
header.innerHTML = appName;
app.append(header);
