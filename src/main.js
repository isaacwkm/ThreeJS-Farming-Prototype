import * as THREE from "/node_modules/three/build/three.module.js";
import YAML from "js-yaml";

import { Grid } from "./models.js";
import { Player } from "./models.js";
import { Plant } from "./models.js";
import { yamlString } from "./scenarios.js";

// Game Initialization
let width;
let height;
const availablePlants = [];
let plantsRequirement = {plants: 0, time: 0};
const specialEvents = [];

const plantsOnGrid = new Map();

function scenarioLoader(scenario) {
  width = scenario.grid_size[0];
  height = scenario.grid_size[1];

  for (let plantName of scenario.available_plants) {
    if (Plant.getTypeNames().find(typeName => typeName == plantName))
      availablePlants.push(plantName);
    else
      throw new Error("Invalid Scenario: Plant unrecognized");
  }

  plantsRequirement = scenario.win_conditions[0];

  if (scenario.special_events) {
    for (let event of scenario.special_events)
      specialEvents.push(event);
  }
}

const config = YAML.load(yamlString);
scenarioLoader(config.drought);
console.log(specialEvents);

const grid = new Grid(width, height);
const playerCharacter = new Player(0, 0, width, height);

const undoStack = [];
const redoStack = [];

let currentPlantType = availablePlants[0];
let currentDay = 0;
let adultsHarvested = 0;

// Game Functions (Updated to work with THREE.js)
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
        checkSpecialEvents(currentDay);
        data.after_grid = grid.serialize();
      } else {
        grid.deserialize(data.after_grid);
      }
      for (const [key, plant] of plantsOnGrid) {
        data.growthMap.set(key, plant.growthStage);
        plant.grow(grid.getSunAt(plant.x, plant.y), grid.getWaterAt(plant.x, plant.y), plantsOnGrid);
      }
      currentDay++;
    },
    undo() {
      grid.deserialize(data.before_grid);
      for (const [key, plant] of plantsOnGrid) {
        plant.growthStage = data.growthMap.get(key);
      }
      currentDay--;
    },
  };
}

function createSowCommand(x, y) {
  const data = { plant: new Plant(currentPlantType, x, y, 0) };
  return {
    execute() {
      plantsOnGrid.set(`${x}${y}`, data.plant);
      grid.sowCell(x, y);
    },
    undo() {
      plantsOnGrid.delete(`${x}${y}`);
      grid.sowCell(x, y);
    },
  };
}

function createReapCommand(x, y) {
  const data = { plant: plantsOnGrid.get(`${x}${y}`) };
  return {
    execute() {
      plantsOnGrid.delete(`${x}${y}`);
      if (data.plant.growthStage == 3)
        adultsHarvested++;
      grid.sowCell(x, y);
    },
    undo() {
      plantsOnGrid.set(`${x}${y}`, data.plant);
      if (data.plant.growthStage == 3)
        adultsHarvested--;
      grid.sowCell(x, y);
    },
  };
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

function checkSpecialEvents(currentDay) {
  const currentEvents = specialEvents.filter(event => event.day == currentDay)
  for (const event of currentEvents) {
    console.log(`Special Event: ${event.description}`);
    applyEffects(event.effect);
  }
}

function applyEffects(effects) {
  for (const effect of effects) {
    switch (effect.type) {
      case "sun":
        grid.increaseSunRange(effect.change);
        grid.setGridValue("sun", effect.change);
        break;
      case "water":
        grid.setGridValue("water", effect.change);
        break;
    }
  }
}

function createSave(key) {
  const saveFile = {
    playerPos: { x: playerCharacter.x, y: playerCharacter.y },
    gridState: grid.serialize(),
    plantMap: Array.from(plantsOnGrid.entries()),
    gameState: { currentDay, adultsHarvested },
    timestamp: new Date().toISOString(),
  };
  const saveData = JSON.stringify(saveFile);
  localStorage.setItem(key, saveData);
  if (key !== "autosave")
    console.log(`Game saved under ${key}`);
}

function copyDataFromFile(saveFile) {
  playerCharacter.x = saveFile.playerPos.x;
  playerCharacter.y = saveFile.playerPos.y;

  grid.deserialize(saveFile.gridState);

  plantsOnGrid.clear();
  saveFile.plantMap.forEach((plant) => {
    const newPlant = Plant.plantCopy(plant[1]);
    plantsOnGrid.set(plant[0], newPlant);
  });

  currentDay = saveFile.gameState.currentDay;
  adultsHarvested = saveFile.gameState.adultsHarvested;
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
  const win = adultsHarvested >= plantsRequirement.plants && currentDay <= plantsRequirement.time;
  const lose = currentDay > plantsRequirement.time;
  if (win)
    notify("win");
  else if (lose)
    notify("lose");
}

function notify(name) {
    window.dispatchEvent(new Event(name));
}

// THREE.js Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(
    60, // FOV
    window.innerWidth / window.innerHeight,
    0.1, // Near clipping
    1000 // Far clipping
);
camera.position.set(0, height, width);
scene.add(camera);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Grid Rendering
const gridGroup = createGrid(width, height);
scene.add(gridGroup);
camera.lookAt(gridGroup.position);

function createGrid(gridWidth, gridHeight) {
    const gridGroup = new THREE.Group();
  
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            const planeGeometry = new THREE.PlaneGeometry(1, 1);
            const planeMaterial = new THREE.MeshBasicMaterial({
                color: 0x228B22,
                wireframe: true,
            });
            const gridPlane = new THREE.Mesh(planeGeometry, planeMaterial);
            gridPlane.rotation.x = -Math.PI / 2;
            gridPlane.position.set(i, 0, j);
            gridGroup.add(gridPlane);
            console.log(gridPlane.position);
        }
    }
  
    return gridGroup;
}

function updatePlayerPosition() {
    playerMesh.position.set(playerCharacter.x, 0.5, playerCharacter.y);
    camera.position.set(0, height , width + playerCharacter.y);
}

// Player Rendering
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
const playerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(playerMesh);
playerMesh.position.set(0, 0.5, 0);

// Plant Rendering
const plantMeshes = new Map();

// Event Listeners
window.addEventListener("keydown", (e) => {
  handleKeyboardInput(e.key);
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// USE THIS FOR SCENE CHANGES
window.addEventListener("scene-changed", () => {
    checkScenarioWin();
    updatePlayerPosition();
})



// Initialize Game
//autosavePrompt();

// Animation Loop
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// Helper Functions
function createPlantMesh(plant) {
  const plantGeometry = new THREE.ConeGeometry(0.4, 1, 8);
  const plantMaterial = new THREE.MeshLambertMaterial({ color: getPlantColor(plant) });
  const plantMesh = new THREE.Mesh(plantGeometry, plantMaterial);

  plantMesh.position.set(plant.x + 0.5, 0.5, plant.y + 0.5);
  plantMesh.rotation.x = Math.PI / 2;
  plantMeshes.set(`${plant.x}${plant.y}`, plantMesh);
  scene.add(plantMesh);
}

function updatePlantMesh(plant) {
  const key = `${plant.x}${plant.y}`;
  const plantMesh = plantMeshes.get(key);
  if (plantMesh) {
    plantMesh.material.color.set(getPlantColor(plant));
  }
}

function removePlantMesh(x, y) {
  const key = `${x}${y}`;
  const plantMesh = plantMeshes.get(key);
  if (plantMesh) {
    scene.remove(plantMesh);
    plantMeshes.delete(key);
  }
}

function getPlantColor(plant) {
  // Change color based on growth stage
  const colors = [0xADFF2F, 0x7CFC00, 0x32CD32, 0x006400]; // Light green to dark green
  return colors[plant.growthStage] || 0x32CD32;
}

function onRendererClick(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  // Raycaster
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Intersect with grid
  const intersects = raycaster.intersectObject(gridGroup.children[0]);
  if (intersects.length > 0) {
    const intersect = intersects[0];
    const point = intersect.point;

    const gridX = Math.floor(point.x);
    const gridY = Math.floor(point.z);

    farmTheLand(gridX, gridY);
  }
}

renderer.domElement.addEventListener("click", onRendererClick);

// //Renderer
// const canvas = document.querySelector("#three-canvas");
// const renderer = new THREE.WebGLRenderer({
//     //canvas: 
//     canvas,
//     antialias: true,
// });
// renderer.setPixelRatio(globalThis.devicePixelRatio);
// renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
// renderer.shadowMap.enabled = true;

// //Scene
// const scene = new THREE.Scene();
// scene.background = new THREE.Color("white");

// //Camera
// const camera = new THREE.PerspectiveCamera(
//     60,         //fov
//     globalThis.innerWidth / globalThis.innerHeight, //aspect
//     0.1,    //near
//     1000,      //far
// );
// camera.position.set(-3, 3, 7);
// scene.add(camera);

// //Lighting

// //Ambient Lighting
// const ambientLight = new THREE.AmbientLight("white", 3);
// scene.add(ambientLight);

// //Directional Lighting
// const directionalLight = new THREE.DirectionalLight("white", 3);
// directionalLight.position.set(-3, 5, 1);
// directionalLight.castShadow = true;
// scene.add(directionalLight);

// //Box
// const box = new THREE.Mesh(
//     new THREE.BoxGeometry(2, 2, 2),
//     //new THREE.MeshBasicMaterial( {color: 0xFF6347})
//     new THREE.MeshLambertMaterial({color: "firebrick"})
// );
// box.position.y = 1;
// box.castShadow = true;

// //Ground
// const groundMesh = new THREE.Mesh(
//     new THREE.PlaneGeometry(10, 10),
//     //new THREE.MeshBasicMaterial( {color: 0x092e66})
//     new THREE.MeshLambertMaterial({color: 0x092e66})
// );

// groundMesh.rotation.x = THREE.MathUtils.degToRad(-90);
// //groundMesh.rotation.x = -Math.PI / 2;
// groundMesh.receiveShadow = true;
// scene.add(box, groundMesh);

// //Camera Looking
// camera.lookAt(box.position);

// //Render Screen
// renderer.render(scene, camera);

// //Animate
// function animate() {
//     requestAnimationFrame(animate);

//     box.rotation.x += 0.01;
//     box.rotation.y += 0.005;
//     box.rotation.z += 0.01;

//     renderer.render(scene, camera);
// }

// animate();