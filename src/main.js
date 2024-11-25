import * as THREE from 'three';

import { Grid } from "./models.ts";
import { Player } from "./models.ts";

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

/*
import { Grid } from "./models.ts";
import { Player } from "./models.ts";

interface Command {
    execute(): void;
    undo(): void;
}

interface Save {
    playerPos: { x: number, y: number };
    gridState: string;
    timestamp: string;
}

localStorage.clear();

const grid = new Grid();
const playerCharacter = new Player(0, 0, grid.GRID_WIDTH);

const undoStack: Command[] = [];
const redoStack: Command[] = [];

function createMoveCommand(player: Player, dx: number, dy: number) : Command | null {
    const data = { before_dx: 0, before_dy: 0 };
    if (player.boundsCheck(dx, dy)) {
        return {
            execute() {
                player.move(dx, dy)
                data.before_dx = -dx;
                data.before_dy = -dy;
            },
            undo() {
                player.move(data.before_dx, data.before_dy);
            }
        }
    }
    return null;
}

function createTurnCommand(grid: Grid) : Command {
    const data = { before_grid: grid.serialize(), after_grid: "" }
    return {
        execute() {
            if (!data.after_grid) {
                grid.randomize();
                data.after_grid = grid.serialize();
            } else {
                grid.deserialize(data.after_grid);
            }
        },
        undo() {
            grid.deserialize(data.before_grid);
        }
    }
}

function handleInput(key: string) {
    redoStack.splice(0, redoStack.length);
    
    const inputMap: Record<string, Command> = {
        "ArrowLeft": createMoveCommand(playerCharacter, -1, 0)!,
        "ArrowRight": createMoveCommand(playerCharacter, 1, 0)!,
        "ArrowUp": createMoveCommand(playerCharacter, 0, -1)!,
        "ArrowDown": createMoveCommand(playerCharacter, 0, 1)!,
        "Enter": createTurnCommand(grid),
    };

    const command = inputMap[key];
    if (command) {
        undoStack.push(command);
        command.execute();
        notify("scene-changed");
    }
}

function Undo() {
    if (undoStack.length > 0) {
        const command = undoStack.pop()!;
        command.undo();
        redoStack.push(command);
        notify("scene-changed");
    }
}

function Redo() {
    if (redoStack.length > 0) {
        const command = redoStack.pop()!;
        command.execute();
        undoStack.push(command);
        notify("scene-changed");
    }
}

function createSave(key: string) {
    const saveFile: Save = {
        playerPos: { x: playerCharacter.x, y: playerCharacter.y },
        gridState: grid.serialize(),
        timestamp: new Date().toISOString(),
    };

    const saveData = JSON.stringify(saveFile);
    localStorage.setItem(key, saveData);
    console.log(`Game saved under ${key}:`, saveFile);
}

function loadSave(key: string) {
    const saveData = localStorage.getItem(key);
    if (!saveData) {
        console.error(`No save file found under ${key}`);
        return;
    }
    const saveFile: Save = JSON.parse(saveData);

    undoStack.splice(0, undoStack.length);
    redoStack.splice(0, redoStack.length);

    playerCharacter.x = saveFile.playerPos.x;
    playerCharacter.y = saveFile.playerPos.y;
    grid.deserialize(saveFile.gridState);
    notify("scene-changed");
    console.log(`Game loaded from save ${key}`);
}

type EventName = "scene-changed";
function notify(name: EventName) {
    canvas.dispatchEvent(new Event(name));
}

window.addEventListener("keydown", (e) => {
    handleInput(e.key);
})

const canvas = document.createElement("canvas");
canvas.height = canvas.width = 400;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
const tileWidth = canvas.width / grid.GRID_WIDTH;

function drawPlayer(player: Player) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const basePositionX = tileWidth * player.x;
    const basePositionY = tileWidth * player.y;
    const centerOffset = tileWidth / 2 - 10;
    ctx.fillRect(basePositionX + centerOffset, basePositionY + centerOffset, 20, 20);
}

canvas.addEventListener("scene-changed", () => {
    drawPlayer(playerCharacter);
})

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", Undo);
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", Redo)
document.body.appendChild(redoButton);

const saveButton = document.createElement("button");
saveButton.innerHTML = "Save";
saveButton.addEventListener("click", () => {
    const key = prompt("Enter save name")!;
    createSave(key);
})
document.body.appendChild(saveButton);

const loadButton = document.createElement("button");
loadButton.innerHTML = "Load";
loadButton.addEventListener("click", () => {
    const key = prompt("Enter save name")!;
    loadSave(key);
})
document.body.appendChild(loadButton);

notify("scene-changed");
*/