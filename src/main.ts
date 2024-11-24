import { Grid } from "./grid";

const grid = new Grid();

console.log(grid.readCell(2, 3));
grid.randomize();
console.log(grid.readCell(2, 3));

const canvas = document.createElement("canvas");
canvas.height = canvas.width = 400;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;