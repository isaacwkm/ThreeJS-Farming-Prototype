import * as THREE from "three"

export class GridView {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.gridGroup = new THREE.Group(); // A THREE.js group for grid tiles
    }

    // Create the grid
    createGrid() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const planeGeometry = new THREE.PlaneGeometry(1, 1);
                const planeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x228B22, // Green color
                    wireframe: false,
                });

                const gridTile = new THREE.Mesh(planeGeometry, planeMaterial);
                gridTile.rotation.x = -Math.PI / 2;
                gridTile.position.set(i, 0, j); // Place tile in grid layout
                this.gridGroup.add(gridTile);
            }
        }
    }

    getGrid() {
        return this.gridGroup;
    }

    getPosition() {
        return this.gridGroup.position;
    }
}

export class PlayerView {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const playerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        this.playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

        this.playerMesh.position.set(this.x, 0.5, this.y);
    }

    updatePosition(newX, newY) {
        this.x = newX;
        this.y = newY;
        this.playerMesh.position.set(this.x, 0.5, this.y);
    }

    getPlayerMesh() {
        return this.playerMesh;
    }
}

const plantSpecs = {
    bean: [
        {
            geometry: () => new THREE.SphereGeometry(0.05, 8, 8),
            material: () => new THREE.MeshLambertMaterial({ color: 0x3d3232 }),
            yOffset: 0,
        },
        {
            geometry: () => new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8),
            material: (plant) => new THREE.MeshLambertMaterial({ color: getPlantColor(plant) }),
            yOffset: 0.25,
            rotation: true,
        },
        {
            geometry: () => new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8),
            material: (plant) => new THREE.MeshLambertMaterial({ color: getPlantColor(plant) }),
            yOffset: 0.5,
            rotation: true,
        },
    ],
    corn: [
        {
            geometry: () => new THREE.ConeGeometry(0.4, 1, 8),
            material: (plant) => new THREE.MeshLambertMaterial({ color: getPlantColor(plant) }),
            yOffset: 0,
            rotation: true,
        },
        {
            geometry: () => new THREE.CapsuleGeometry(0.2, 0.5, 4, 6),
            material: () => new THREE.MeshLambertMaterial({ color: 0xffd700 }),
            yOffset: 0.75,
            rotation: true,
        },
    ],
    potato: [
        {
            geometry: () => new THREE.SphereGeometry(0.25, 8, 8),
            material: () => new THREE.MeshLambertMaterial({ color: 0xa2a27d }),
            yOffset: 0,
        },
        {
            geometry: () => new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
            material: (plant) => new THREE.MeshLambertMaterial({ color: getPlantColor(plant) }),
            yOffset: 0.25,
            rotation: true,
        },
        {
            geometry: () => new THREE.ConeGeometry(0.1, 0.25, 8),
            material: (plant) => new THREE.MeshLambertMaterial({ color: getPlantColor(plant) }),
            yOffset: 0.5,
            rotation: true,
        },
    ],
    onion: [
        {
            geometry: () => new THREE.SphereGeometry(0.2, 8, 8),
            material: () => new THREE.MeshLambertMaterial({ color: 0x542346 }),
            yOffset: 0,
        },
        {
            geometry: () => new THREE.ConeGeometry(0.1, 0.5, 8),
            material: (plant) => new THREE.MeshLambertMaterial({ color: getPlantColor(plant) }),
            yOffset: 0.25,
            rotation: true,
        },
    ]
}

function getPlantColor(plant) {
    // Change color based on growth stage
    const colors = [0xADFF2F, 0x7CFC00, 0x32CD32, 0x006400]; // Light green to dark green
    return colors[plant.growthStage] || 0x32CD32;
}

export class PlantViews {
    constructor(scene) {
        this.scene = scene;
        this.plantMeshes = new Map();
    }
    createMeshGroup(plant, specs) {
        const plantMesh = new THREE.Group();

        specs.forEach((part) => {
            const geometry = part.geometry();
            const material = part.material(plant);
            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(plant.x, part.yOffset, plant.y);
            if (part.rotation)
                mesh.rotation.x = -Math.PI;

            plantMesh.add(mesh);
        })

        this.plantMeshes.set(`${plant.x}${plant.y}`, plantMesh);
        this.scene.add(plantMesh);
    }
    createPlantMesh(plant) {
        const specs = plantSpecs[plant.type];
        if (!specs)
            throw new Error(`Unknown plant type: ${plant.type}`);
        this.createMeshGroup(plant, specs);
    }
    updateMeshes(plantsOnGrid, renderer) {
        for (const [key, mesh] of this.plantMeshes) {
            renderer.removeFromScene(mesh);
            this.plantMeshes.delete(key);
        }
        for (const [key, plant] of plantsOnGrid) {
            if (!this.plantMeshes.has(key)) {
                this.createPlantMesh(plant);
            }
        }
    }
}