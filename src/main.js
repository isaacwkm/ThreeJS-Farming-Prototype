import * as THREE from 'three';

import { Grid } from "./models.js";
import { Player } from "./models.js";
import { Plant } from './models.js';

const grid = new Grid();
const playerCharacter = new Player(0, 0, grid.GRID_WIDTH, grid.GRID_WIDTH);

const undoStack = [];
const redoStack = [];

const plants = new Map();

let currentPlantType = "🌽";
let currentDay = 0;
let reapFull = 0;

function createMoveCommand(player, dx, dy) {
    const data = { before_dx: 0, before_dy: 0 };
    if (player.boundsCheck(dx, dy)) {
        return {
            execute() {
                player.move(dx, dy);
                data.before_dx = -dx;
                data.before_dy = -dy;
            },
            undo() {
                player.move(data.before_dx, data.before_dy);
            }
        };
    }
    return null;
}

function createTurnCommand(grid) {
    const data = {
        before_grid: grid.serialize(),
        after_grid: "",
        growthMap: new Map()
    };
    return {
        execute() {
            if (!data.after_grid) {
                grid.randomize();
                data.after_grid = grid.serialize();
            }
            else {
                grid.deserialize(data.after_grid);
            }
            for (const [key, plant] of plants) {
                data.growthMap.set(key, plant.growthStage);
                plant.grow(grid.getSunAt(plant.x, plant.y), grid.getWaterAt(plant.x, plant.y), plants);
            }
        },
        undo() {
            grid.deserialize(data.before_grid);
            for (const [key, plant] of plants) {
                plant.growthStage = data.growthMap.get(key);
            }
        }
    };
}

function createSowCommand(x, y) {
    const data = { plant: Plant.switchPlant(currentPlantType, x, y, 0) };
    return {
        execute() {
            plants.set(`${x}${y}`, data.plant);
            grid.sowCell(x, y);
        },
        undo() {
            plants.delete(`${x}${y}`);
            grid.sowCell(x, y);
        }
    };
}

function createReapCommand(x, y) {
    const data = { plant: plants.get(`${x}${y}`) };
    return {
        execute() {
            plants.delete(`${x}${y}`);
            grid.sowCell(x, y);
            advanceScenario(data.plant);
        },
        undo() {
            plants.set(`${x}${y}`, data.plant);
            grid.sowCell(x, y);
            revertScenario(data.plant);
        }
    };
}

function advanceScenario(plant) {
    if (plant.growthStage == 3)
        reapFull++;
}

function revertScenario(plant) {
    if (plant.growthStage == 3)
        reapFull--;
}

function handleKeyboardInput(key) {
    redoStack.splice(0, redoStack.length);
    const inputMap = {
        "ArrowLeft": createMoveCommand(playerCharacter, -1, 0),
        "ArrowRight": createMoveCommand(playerCharacter, 1, 0),
        "ArrowUp": createMoveCommand(playerCharacter, 0, -1),
        "ArrowDown": createMoveCommand(playerCharacter, 0, 1),
        "Enter": createTurnCommand(grid),
    };
    const command = inputMap[key];
    manageCommand(command);
}

function farmTheLand(x, y) {
    redoStack.splice(0, redoStack.length);
    if (playerCharacter.isAdjacent(x, y)) {
        if (!grid.readCell(x, y).sowed)
            manageCommand(createSowCommand(x, y));
        else
            manageCommand(createReapCommand(x, y));
    }
}

function manageCommand(command) {
    if (command) {
        undoStack.push(command);
        command.execute();
        notify("scene-changed");
    }
}

function Undo() {
    if (undoStack.length > 0) {
        const command = undoStack.pop();
        command.undo();
        redoStack.push(command);
        notify("scene-changed");
    }
}

function Redo() {
    if (redoStack.length > 0) {
        const command = redoStack.pop();
        command.execute();
        undoStack.push(command);
        notify("scene-changed");
    }
}

function createSave(key) {
    const saveFile = {
        playerPos: { x: playerCharacter.x, y: playerCharacter.y },
        gridState: grid.serialize(),
        plantMap: Array.from(plants.entries()),
        inGameTime: currentDay,
        timestamp: new Date().toISOString(),
    };
    const saveData = JSON.stringify(saveFile);
    localStorage.setItem(key, saveData);
    if (key != "autosave")
        console.log(`Game saved under ${key}`);
}

function copyDataFromFile(saveFile) {
    playerCharacter.x = saveFile.playerPos.x;
    playerCharacter.y = saveFile.playerPos.y;
    grid.deserialize(saveFile.gridState);
    plants.clear();
    saveFile.plantMap.forEach((plant) => {
        plants.set(plant[0], Plant.deepCopy(plant[1]));
    });
}

function listSaves() {
    console.log("Saves found:");
    for (let i = 0, len = localStorage.length; i < len; i++) {
        console.log(localStorage.key(i));
    }
}

function loadSave(key) {
    const saveData = localStorage.getItem(key);
    if (!saveData) {
        console.error(`No save file found under ${key}`);
        return;
    }
    const saveFile = JSON.parse(saveData);
    undoStack.splice(0, undoStack.length);
    redoStack.splice(0, redoStack.length);
    copyDataFromFile(saveFile);
    notify("scene-changed");
    console.log(`Game loaded from save ${key}`);
}

function autosavePrompt() {
    if (localStorage.getItem("autosave")) {
        if (confirm("Would you like to continue where you left off?"))
            loadSave("autosave");
        else
            localStorage.removeItem("autosave");
    }
}

function checkScenarioWin() {
    if (reapFull >= 20)
        return true;
}

function notify(name) {
    canvas.dispatchEvent(new Event(name));
}

window.addEventListener("keydown", (e) => {
    handleKeyboardInput(e.key);
});

//Renderer
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({
    //canvas: 
    canvas,
    antialias: true,
});
renderer.setPixelRatio(globalThis.devicePixelRatio);
renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
renderer.shadowMap.enabled = true;

//Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('white');

//Camera
const camera = new THREE.PerspectiveCamera(
    60,         //fov
    globalThis.innerWidth / globalThis.innerHeight, //aspect
    0.1,    //near
    1000,      //far
);
camera.position.set(-3, 3, 7);
scene.add(camera);

//Lighting

//Ambient Lighting
const ambientLight = new THREE.AmbientLight('white', 3);
scene.add(ambientLight);

//Directional Lighting
const directionalLight = new THREE.DirectionalLight('white', 3);
directionalLight.position.set(-3, 5, 1);
directionalLight.castShadow = true;
scene.add(directionalLight);

//Box
const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    //new THREE.MeshBasicMaterial( {color: 0xFF6347})
    new THREE.MeshLambertMaterial({color: 'firebrick'})
);
box.position.y = 1;
box.castShadow = true;

//Ground
const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    //new THREE.MeshBasicMaterial( {color: 0x092e66})
    new THREE.MeshLambertMaterial({color: 0x092e66})
);

groundMesh.rotation.x = THREE.MathUtils.degToRad(-90);
//groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(box, groundMesh);

//Camera Looking
camera.lookAt(box.position);

//Render Screen
renderer.render(scene, camera);

//Animate
function animate() {
    requestAnimationFrame(animate);

    box.rotation.x += 0.01;
    box.rotation.y += 0.005;
    box.rotation.z += 0.01;

    renderer.render(scene, camera);
}

animate();
