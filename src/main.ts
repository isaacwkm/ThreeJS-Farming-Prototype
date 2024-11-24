import { Grid } from "./models";
import { Player } from "./models";

interface Command {
    execute(): void;
    undo(): void;
}

const grid = new Grid();

const undoStack : Command[] = [];
const redoStack : Command[] = [];

function createMoveCommand(player: Player, dx: number, dy: number) : Command {
    const data = {before_dx: 0, before_dy: 0};
    return {
        execute() {
            if (player.boundsCheck(dx, dy)) {
                player.move(dx, dy)
                data.before_dx = -dx;
                data.before_dy = -dy;
            }
        },
        undo() {
            player.move(data.before_dx, data.before_dy);
        }
    }
}

function handleInput(key: string) {
    const inputMap: Record<string, Command> = {
        "ArrowUp": createMoveCommand(playerCharacter, 0, -1),
        "ArrowDown": createMoveCommand(playerCharacter, 0, 1),
        "ArrowLeft": createMoveCommand(playerCharacter, -1, 0),
        "ArrowRight": createMoveCommand(playerCharacter, 1, 0),
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

type EventName = "scene-changed";
function notify(name: EventName) {
    canvas.dispatchEvent(new Event(name));
}

const playerCharacter = new Player(0, 0, grid.GRID_WIDTH);

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
    const playerPos = playerCharacter.getPosition();
    console.log(grid.readCell(playerPos.x, playerPos.y))
})

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", Undo);
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", Redo)
document.body.appendChild(redoButton);

notify("scene-changed");