import { allPlantDefinitions } from "./plants.js";

export class Grid {
    constructor(width, height) {
        this.GRID_WIDTH = width;
        this.GRID_HEIGHT = height;

        this.colOffset = 0;
        this.rowOffset = 4;
        this.sunOffset = 8;
        this.waterOffset = 12;
        this.sowOffset = 16;
        this.cellSize = 20;

        this.maxSun = 10;

        this.numCells = this.GRID_WIDTH * this.GRID_HEIGHT;
        this.grid = new ArrayBuffer(this.cellSize * this.numCells);
        this.gridView = new DataView(this.grid);
        for (let col = 0; col < this.GRID_WIDTH; col++) {
            for (let row = 0; row < this.GRID_HEIGHT; row++) {
                const sun = Math.floor(Math.random() * this.maxSun);
                const water = Math.floor(Math.random() * 3);
                this.initCell(col, row, sun, water);
            }
        }
    }

    getCellOffset(i, j) {
        const index = j * this.GRID_WIDTH + i;
        const cellOffset = index * this.cellSize;
        return cellOffset;
    }

    initCell(i, j, sun, water) {
        const cellOffset = this.getCellOffset(i, j);

        this.gridView.setInt32(cellOffset + this.colOffset, i);
        this.gridView.setInt32(cellOffset + this.rowOffset, j);
        this.gridView.setInt32(cellOffset + this.sunOffset, sun);
        this.gridView.setInt32(cellOffset + this.waterOffset, water);
        this.gridView.setInt8(cellOffset + this.sowOffset, 0);
    }

    readCell(col, row) {
        const cellOffset = this.getCellOffset(col, row);

        const i = this.gridView.getInt32(cellOffset + this.colOffset);
        const j = this.gridView.getInt32(cellOffset + this.rowOffset);
        const sun = this.gridView.getInt32(cellOffset + this.sunOffset);
        const water = this.gridView.getInt32(cellOffset + this.waterOffset);
        const sowed = this.gridView.getInt32(cellOffset + this.sowOffset);
        
        return { i, j, sun, water, sowed };
    }

    getSunAt(col, row) {
        const cellOffset = this.getCellOffset(col, row);
        return this.gridView.getInt32(cellOffset + this.sunOffset);
    }

    getWaterAt(col, row) {
        const cellOffset = this.getCellOffset(col, row);
        return this.gridView.getInt32(cellOffset + this.waterOffset);
    }

    setSun(value) {
        this.maxSun = value;
        
    }

    setWater(value) {
        for (let col = 0; col < this.GRID_WIDTH; col++) {
            for (let row = 0; row < this.GRID_HEIGHT; row++) {
                const cellOffset = this.getCellOffset(col, row);
                this.gridView.setInt32(cellOffset + this.sunOffset, value);
            }
        }
    }

    sowCell(col, row) {
        const cellOffset = this.getCellOffset(col, row);
        const sowBool = this.gridView.getInt32(cellOffset + this.sowOffset);
        if (sowBool == 0)
            this.gridView.setInt32(cellOffset + this.sowOffset, 1);
        else
            this.gridView.setInt32(cellOffset + this.sowOffset, 0);
    }

    randomize() {
        for (let col = 0; col < this.GRID_WIDTH; col++) {
            for (let row = 0; row < this.GRID_HEIGHT; row++) {
                const cellOffset = this.getCellOffset(col, row);
                const sun = Math.floor(Math.random() * this.maxSun);
                this.gridView.setInt32(cellOffset + this.sunOffset, sun);

                const waterVars = [-1, 0, 1, 2];
                const waterDelta = waterVars[Math.floor(Math.random() * waterVars.length)];
                let water = this.gridView.getInt32(cellOffset + this.waterOffset) + waterDelta;
                water = Math.min(Math.max(water, 0), 3);
                this.gridView.setInt32(cellOffset + this.waterOffset, water);
            }
        }
    }

    serialize() {
        const gridData = new Uint8Array(this.grid);
        return btoa(String.fromCharCode(...gridData));
    }

    deserialize(serializedGrid) {
        const binaryGrid = atob(serializedGrid);
        const gridData = new Uint8Array(binaryGrid.length);
        for (let i = 0; i < binaryGrid.length; i++) {
            gridData[i] = binaryGrid.charCodeAt(i);
        }
        this.grid = gridData.buffer;
        this.gridView = new DataView(gridData.buffer);
    }
}

export class Player {
    constructor(x, y, xMax, yMax) {
        this.x = x;
        this.y = y;
        this.xMax = xMax;
        this.yMax = yMax;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    boundsCheck(dx, dy) {
        const x = this.x + dx;
        const y = this.y + dy;
        if (x < 0 || this.xMax <= x)
            return false;
        if (y < 0 || this.yMax <= y)
            return false;
        return true;
    }

    isAdjacent(gridX, gridY) {
        const adjColumn = this.x - 1 <= gridX && gridX <= this.x + 1;
        const adjRow = this.y - 1 <= gridY && gridY <= this.y + 1;
        if (adjColumn && adjRow)
            return true;
        return false;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }
}

class internalPlant {
    constructor() {
        this.fullName = "plant";
        this.symbol = "🌱";
        this.nextLevel = (ctx) => ctx.plant.level;
    }
}

function internalPlantCompiler (program) {
    const internalPlantType = new internalPlant();
    const dsl = {
        name(name) {
            internalPlantType.fullName = name;
        },
        icon(icon) {
            internalPlantType.symbol = icon;
        },
        grow(grow) {
            internalPlantType.nextLevel = (ctx) => {
                return ctx.plant.growthStage + (grow(ctx) ? 1 : 0);
            }
        },
    };
    program(dsl);
    return internalPlantType;
}

export const allPlantTypes = allPlantDefinitions.map(internalPlantCompiler);

export class Plant {
    constructor(type, x, y, growthStage = 0) {
        const plantType = allPlantTypes.find(plantType => plantType.fullName == type);
        if (!plantType)
            throw new Error("Plant unrecognized");

        this.type = type;
        this.x = x;
        this.y = y;
        this.growthStage = growthStage;
        this.plantType = plantType;
    }

    getIcon() {
        return this.plantType.symbol;
    }

    getNeighbors(x, y, plantMap) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0)
                    continue;
                const neighborX = x + dx;
                const neighborY = y + dy;
                const neighborKey = neighborX.toString() + neighborY.toString();
                if (plantMap.get(neighborKey))
                    neighbors.push(plantMap.get(neighborKey));
            }
        }
        return neighbors;
    }

    grow(sun, water, plantMap) {
        const plantNeighbors = this.getNeighbors(this.x, this.y, plantMap);
        const growthContext = {
            plant: this,
            sun,
            water,
            neighbors: plantNeighbors
        }
        const newLevel = this.plantType.nextLevel(growthContext);
        this.growthStage = Math.min(newLevel, 3);
    }

    static plantCopy(plant) {
        return new Plant(plant.type, plant.x, plant.y, plant.growthStage);
    }

    static getTypeNames() {
        const typeNames = [];
        for (let plant of allPlantTypes) {
            typeNames.push(plant.fullName);
        }
        return typeNames;
    }
}