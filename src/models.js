export class Grid {
    constructor() {
        this.GRID_WIDTH = 6;

        this.colOffset = 0;
        this.rowOffset = 4;
        this.sunOffset = 8;
        this.waterOffset = 12;
        this.sowOffset = 16;
        this.cellSize = 20;

        this.numCells = this.GRID_WIDTH * this.GRID_WIDTH;
        this.grid = new ArrayBuffer(this.cellSize * this.numCells);
        this.gridView = new DataView(this.grid);
        for (let col = 0; col < this.GRID_WIDTH; col++) {
            for (let row = 0; row < this.GRID_WIDTH; row++) {
                const sun = Math.floor(Math.random() * 10);
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
            for (let row = 0; row < this.GRID_WIDTH; row++) {
                const cellOffset = this.getCellOffset(col, row);
                const sun = Math.floor(Math.random() * 10);
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

const PlantTypes = {
    "🫘": {
        minSun: 3,
        minWater: 2,
        canGrow: function(sun, water, neighbors) {
            const sameNeighbors = neighbors
                .filter(plant => plant.type === "🫘");
            const isHappy = sameNeighbors.length >= 2;
            return isHappy && sun > this.minSun && water > this.minWater;
        },
    },
    "🌽": {
        minSun: 1,
        minWater: 2,
        canGrow: function(sun, water) {
            return sun > this.minSun && water > this.minWater;
        }
    },
}

export class Plant {
    constructor(type, x, y, growthStage = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.growthStage = growthStage;
        this.plantRules = PlantTypes[this.type];
        if (!this.plantRules)
            throw new Error("Plant unrecognized");
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
        const neighbors = this.getNeighbors(this.x, this.y, plantMap);

        if (this.plantRules.canGrow(sun, water, neighbors) && this.growthStage < 3)
            this.growthStage++;
    }

    static plantCopy(plant) {
        return new Plant(plant.type, plant.x, plant.y, plant.growthStage);
    }
}

// export class Plant {
//     constructor(type, x, y, growthStage = 0, minSun = 1, minWater = 1) {
//         this.type = type;
//         this.x = x;
//         this.y = y;
//         this.growthStage = growthStage;
//         this.minSun = minSun;
//         this.minWater = minWater;
//         this.familyNeighbors = 0; // Keeps track of same plants in neighboring cells
//     }

//     grow(sun, water, plantMap) { }

//     _checkSunAndWater(sun, water) {
//         // Check if the passed values meet minimum conditions
//         if (sun < this.minSun) {
//             // needs more sun
//             return false;
//         }
//         if (water < this.minWater) {
//             // needs more water
//             return false;
//         }
//         return true; // Meets conditions
//     }

//     _checkNeighborsForBoost(x, y, plantMap) {
//         this.familyNeighbors = 0;
//         for (let dx = -1; dx <= 1; dx++) {
//             for (let dy = -1; dy <= 1; dy++) {
//                 if (dx === 0 && dy === 0)
//                     continue; // Skip self
//                 const neighborX = x + dx;
//                 const neighborY = y + dy;
//                 const neighborKey = neighborX.toString() + neighborY.toString();
//                 const neighborPlant = plantMap.get(neighborKey);
//                 if (neighborPlant && (neighborPlant.type === this.type)) {
//                     this.familyNeighbors++;
//                 }
//             }
//         }
//     }

//     static switchPlant(type, x, y, growthStage) {
//         switch (type) {
//             case "🫘": return new BeanPlant(x, y, growthStage);
//             case "🌽": return new CornPlant(x, y, growthStage);
//             default: throw new Error("Plant unrecognized");
//         }
//     }

//     static deepCopy(plant) {
//         const plantCopy = this.switchPlant(plant.type, plant.x, plant.y, plant.growthStage);
//         return plantCopy;
//     }
// }

// export class BeanPlant extends Plant {
//     constructor(x, y, growthStage = 0) {
//         super("🫘", x, y, growthStage, 3, 2); // Beans need minimum 3 sun, 2 water
//     }

//     // grow method: Beans grow faster with neighbors
//     grow(sun, water, plantMap) {
//         this._checkNeighborsForBoost(this.x, this.y, plantMap); // this.familyNeighbors is ready to use
//         const canGrow = this._checkSunAndWater(sun, water) && this.growthStage < 3;
//         if (canGrow && this.familyNeighbors >= 2) {
//             this.growthStage++;
//         }
//     }
// }

// export class CornPlant extends Plant {
//     constructor(x, y, growthStage = 0) {
//         super("🌽", x, y, growthStage, 1, 2);
//     }

//     grow(sun, water) {
//         // Logic for plant growth
//         const canGrow = this._checkSunAndWater(sun, water) && this.growthStage < 3;
//         if (canGrow) {
//             this.growthStage++;
//         }
//     }
// }