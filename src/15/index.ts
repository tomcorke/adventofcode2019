import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine } from "../int-code-machine";
import readline from "readline";
import clear from "clear";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getInput = readFileSeparated(",", "15", "input").then(values =>
  values.map(toNumber)
);

const DIRECTION_NORTH = 1;
const DIRECTION_SOUTH = 2;
const DIRECTION_EAST = 3;
const DIRECTION_WEST = 4;
type Direction =
  | typeof DIRECTION_NORTH
  | typeof DIRECTION_SOUTH
  | typeof DIRECTION_EAST
  | typeof DIRECTION_WEST;

const MOVE_RESULT_WALL = 0;
const MOVE_RESULT_FLOOR = 1;
const MOVE_RESULT_OXYGEN = 2;

type MoveResult =
  | typeof MOVE_RESULT_WALL
  | typeof MOVE_RESULT_FLOOR
  | typeof MOVE_RESULT_OXYGEN;

const FLOOD_VALUE = 3;

class Robot {
  public facing: Direction = DIRECTION_NORTH;
  public map: { [x: number]: { [y: number]: number } } = { [0]: { [0]: 1 } };
  public x: number = 0;
  public y: number = 0;

  private setMap(x: number, y: number, value: number) {
    this.map[x] = this.map[x] || {};
    this.map[x][y] = value;
  }

  public move(moveResult: MoveResult) {
    let [vx, vy] = [this.x, this.y];
    switch (this.facing) {
      case DIRECTION_NORTH:
        vy -= 1;
        break;
      case DIRECTION_SOUTH:
        vy += 1;
        break;
      case DIRECTION_EAST:
        vx += 1;
        break;
      case DIRECTION_WEST:
        vx -= 1;
        break;
    }
    switch (moveResult) {
      case MOVE_RESULT_FLOOR:
        this.x = vx;
        this.y = vy;
      case MOVE_RESULT_WALL:
        this.setMap(vx, vy, moveResult);
        break;
      case MOVE_RESULT_OXYGEN:
        this.x = vx;
        this.y = vy;
        this.setMap(vx, vy, moveResult);
        console.log("WE FOUND THE OXYGEN, WE'RE SAVED!");
        break;
    }
  }

  private getMap(x: number, y: number) {
    return (this.map[x] && this.map[x][y]) || 0;
  }

  public flood(fromX: number = 0, fromY: number = 0) {
    if (this.map[fromX][fromY] !== 3) {
      this.map[fromX][fromY] = 3;
      return;
    }
    const xKeys = Object.keys(this.map).map(toNumber);
    const yKeys = Object.values(this.map).flatMap(x =>
      Object.keys(x).map(toNumber)
    );
    const minX = Math.min(...xKeys);
    const maxX = Math.max(...xKeys);
    const minY = Math.min(...yKeys);
    const maxY = Math.max(...yKeys);

    let newCoords: [number, number][] = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (
          this.getMap(x, y) === MOVE_RESULT_FLOOR ||
          this.getMap(x, y) === MOVE_RESULT_OXYGEN
        ) {
          if (
            this.getMap(x - 1, y) === FLOOD_VALUE ||
            this.getMap(x + 1, y) === FLOOD_VALUE ||
            this.getMap(x, y - 1) === FLOOD_VALUE ||
            this.getMap(x, y + 1) === FLOOD_VALUE
          ) {
            newCoords.push([x, y]);
          }
        }
      }
    }

    newCoords.forEach(([x, y]) => {
      this.map[x][y] = FLOOD_VALUE;
    });
  }

  public find(value: number) {
    const xKeys = Object.keys(this.map).map(toNumber);
    const yKeys = Object.values(this.map).flatMap(x =>
      Object.keys(x).map(toNumber)
    );
    const minX = Math.min(...xKeys);
    const maxX = Math.max(...xKeys);
    const minY = Math.min(...yKeys);
    const maxY = Math.max(...yKeys);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this.getMap(x, y) === value) {
          return { x, y };
        }
      }
    }
  }

  public render() {
    const xKeys = Object.keys(this.map).map(toNumber);
    const yKeys = Object.values(this.map).flatMap(x =>
      Object.keys(x).map(toNumber)
    );
    const minX = Math.min(...xKeys);
    const maxX = Math.max(...xKeys);
    const minY = Math.min(...yKeys);
    const maxY = Math.max(...yKeys);

    const xRange = Array.from(Array(maxX - minX + 3)).map(
      (_, i) => i + minX - 1
    );

    const lines: string[] = [];
    for (let y = minY; y <= maxY; y++) {
      const line = xRange
        .map(x => {
          if (x === this.x && y === this.y) {
            return " ☺";
          }
          const xMap = this.map[x];
          const yValue = xMap && xMap[y];
          switch (yValue) {
            case 99:
              return " ⚐";
            case 1:
              return "  ";
            case 2:
              return " ⚑";
            case FLOOD_VALUE:
              return "%%";
            default:
              return "██";
          }
        })
        .join("");
      lines.push(line);
    }
    console.log(lines.join("\n"));
  }
}

const validateMoveResult = (result: number): MoveResult => {
  if (![0, 1, 2].includes(result)) {
    throw Error("Invalid result, must be number from 0-2");
  }
  return result as MoveResult;
};

const runRobotMachine = async () => {
  const input = await getInput;
  const machine = new IntCodeMachine(input, [], { silent: true });
  const robot = new Robot();

  let testDirection: Direction = 2;
  let testResult: MoveResult = 0;

  const nextDirectionOnSuccess = (direction: Direction) => {
    switch (direction) {
      case DIRECTION_NORTH:
        return DIRECTION_WEST;
      case DIRECTION_EAST:
        return DIRECTION_NORTH;
      case DIRECTION_SOUTH:
        return DIRECTION_EAST;
      case DIRECTION_WEST:
        return DIRECTION_SOUTH;
    }
  };

  const nextDirectionOnFail = (direction: Direction) => {
    switch (direction) {
      case DIRECTION_NORTH:
        return DIRECTION_EAST;
      case DIRECTION_EAST:
        return DIRECTION_SOUTH;
      case DIRECTION_SOUTH:
        return DIRECTION_WEST;
      case DIRECTION_WEST:
        return DIRECTION_NORTH;
    }
  };

  const getNextInput = () => {
    testDirection =
      testResult === 1
        ? nextDirectionOnSuccess(testDirection)
        : nextDirectionOnFail(testDirection);
    machine.input(testDirection);
  };

  machine.onWaitingForInput(getNextInput);

  let endFound = false;

  machine.onOutput(output => {
    const moveOutput = validateMoveResult(output);
    testResult = moveOutput;

    robot.facing = testDirection;
    robot.move(moveOutput);

    if (output === MOVE_RESULT_OXYGEN) {
      endFound = true;
    }

    // Run until we return to the start, so we have the whole map
    if (robot.x === 0 && robot.y === 0 && endFound) {
      machine.halt();
    }
  });

  try {
    await machine.run();
  } catch (e) {
    console.error(e);
  }

  clear();
  robot.render();

  return robot;
};

const solution: Solution = async () => {
  // Run machine to get robot with full map
  const robot = await runRobotMachine();

  const oxygen = robot.find(MOVE_RESULT_OXYGEN);
  if (!oxygen) {
    throw Error("Oxygen not found in map");
  }

  clear();
  let steps = 0;
  robot.flood();

  while (true) {
    if (robot.map[oxygen.x][oxygen.y] === FLOOD_VALUE) {
      break;
    }
    robot.flood();
    steps++;
  }

  robot.render();

  return steps;
};

solution.partTwo = async () => {
  // Run machine to get robot with full map
  const robot = await runRobotMachine();

  const oxygen = robot.find(MOVE_RESULT_OXYGEN);
  if (!oxygen) {
    throw Error("Oxygen not found in map");
  }

  clear();
  let steps = 0;
  robot.flood(oxygen.x, oxygen.y);

  while (true) {
    if (!robot.find(MOVE_RESULT_FLOOR)) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    robot.flood(oxygen.x, oxygen.y);
    steps++;
    clear();
    robot.render();
  }

  robot.render();

  return steps;
};

solution.inputs = [getInput];

export default solution;
