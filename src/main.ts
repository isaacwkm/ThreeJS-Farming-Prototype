import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const GRID_WIDTH = 5;

const colOffset = 0;
const rowOffset = 4;
const sunOffset = 8;
const waterOffset = 12;
const cellSize = 16;

const numCells = GRID_WIDTH * GRID_WIDTH;
const grid = new ArrayBuffer(cellSize * numCells);
const gridView = new DataView(grid);

function writeCell(i: number, j: number, sun: number, water: number) {
    const index = j * GRID_WIDTH + i;
    const cellOffset = index * cellSize;

    gridView.setInt32(cellOffset + colOffset, i);
    gridView.setInt32(cellOffset + rowOffset, j);
    gridView.setInt32(cellOffset + sunOffset, sun);
    gridView.setInt32(cellOffset + waterOffset, water);
}

function readCell(index: number) {
    const cellOffset = index * cellSize;

    const i = gridView.getInt32(cellOffset + colOffset);
    const j = gridView.getInt32(cellOffset + rowOffset);
    const sun = gridView.getInt32(cellOffset + sunOffset);
    const water = gridView.getInt32(cellOffset + waterOffset);

    return { i, j, sun, water };
}

function initializeGrid() {
    for (let column = 0; column < GRID_WIDTH; column++) {
        for (let row = 0; row < GRID_WIDTH; row++) {
            const sun = Math.floor(Math.random() * 10);
            const water = Math.floor(Math.random() * 3);
            writeCell(column, row, sun, water);
        }
    }
}

initializeGrid();