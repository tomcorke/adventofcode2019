import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const readAndParse = (inputName: string) =>
  readFileSeparated("\n", "18", inputName).then(lines =>
    lines.map(line => line.split(""))
  );

const getInput = readAndParse("input");
const getTestInputA = readAndParse("testInputA");
const getTestInputB = readAndParse("testInputB");
const getTestInputC = readAndParse("testInputC");

interface Coord {
  x: number;
  y: number;
}

const _FLOOD_CHAR = "%";
const WALL_CHAR = "#";
const FLOOR_CHAR = ".";
const START_CHAR = "@";

const positionOf = (input: string[][], character: string): Coord => {
  for (let y = 0; y < input.length; y++) {
    const line = input[y];
    const x = line.indexOf(character);
    if (x > -1) {
      return { x, y };
    }
  }
  return { x: -1, y: -1 };
};

interface Character {
  c: string;
}
type FullCoord = Coord & Character;

const KEYS = "abcdefghijklmnopqrstuvwxyz".split("");
const DOORS = KEYS.map(key => key.toUpperCase());
const keyForDoor = (door: string) => door.toLowerCase();

class Flooder {
  private map: string[][];
  private visited: boolean[][] = [];
  private from: FullCoord;
  private remainingKeys: string[];
  private heldKeys: string[];

  private minBound: Coord;
  private maxBound: Coord;

  private flooders: Flooder[] = [];

  private initialSteps: number;
  private steps: number;

  private blocked = false;

  constructor(
    map: string[][],
    from: FullCoord,
    remainingKeys: string[],
    steps: number = 0,
    heldKeys: string[] = []
  ) {
    this.map = map;
    this.from = from;

    this.minBound = from;
    this.maxBound = from;

    this.remainingKeys = remainingKeys;
    this.heldKeys = heldKeys;

    this.initialSteps = steps;
    this.steps = steps;

    // console.log(`Created flooder at ${from.c}`);
    // console.log({ remainingKeys, heldKeys, steps });

    this.setVisited(from.x, from.y);
  }

  private getMap(x: number, y: number) {
    if (!this.map[y]) {
      return null;
    }
    return this.map[y][x] !== undefined ? this.map[y][x] : WALL_CHAR;
  }

  private getVisited(x: number, y: number) {
    if (!this.visited[y]) {
      return false;
    }
    return !!this.visited[y][x];
  }

  private setVisited(x: number, y: number) {
    this.visited[y] = this.visited[y] || [];
    this.visited[y][x] = true;
  }

  private isPassable(tile: string | null): tile is string {
    if (tile === null || tile === WALL_CHAR) {
      return false;
    }
    if (tile === FLOOR_CHAR) {
      return true;
    }
    if (DOORS.includes(tile) && !this.heldKeys.includes(keyForDoor(tile))) {
      return false;
    }
    return true;
  }

  // Returns boolean to indicate whether it was able to step
  public step(maxSteps?: number): boolean {
    let hasChildFlooderStepped = false;

    for (const flooder of this.flooders) {
      hasChildFlooderStepped = flooder.step(maxSteps) || hasChildFlooderStepped;
      if (flooder.complete) {
        return true;
      }
    }

    let visited: Coord[] = [];
    let hasStepped = false;

    if (maxSteps && this.steps - this.initialSteps >= maxSteps) {
      this.blocked = true;
    }

    if (!this.blocked) {
      for (let y = this.minBound.y - 1; y < this.maxBound.y + 2; y++) {
        for (let x = this.minBound.x - 1; x < this.maxBound.x + 2; x++) {
          const offsets = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
          ];
          const tile = this.getMap(x, y);
          if (
            !this.getVisited(x, y) &&
            this.isPassable(tile) &&
            offsets.some(([dx, dy]) => this.getVisited(x + dx, y + dy))
          ) {
            // Push to temporary list
            visited.push({ x, y });
            this.minBound = {
              x: Math.min(this.minBound.x, x),
              y: Math.min(this.minBound.y, y)
            };
            this.maxBound = {
              x: Math.max(this.maxBound.x, x),
              y: Math.max(this.maxBound.y, y)
            };

            // Increment steps if we haven't already
            if (!hasStepped) {
              hasStepped = true;
              this.steps++;
            }

            if (this.remainingKeys.includes(tile)) {
              const flooder = new Flooder(
                this.map,
                { x, y, c: tile },
                this.remainingKeys.filter(k => k !== tile),
                this.steps,
                [...this.heldKeys, tile]
              );
              this.flooders.push(flooder);
              if (flooder.complete) {
                // Return early if we've found a complete route
                return true;
              }
            }
          }
        }
      }
    }

    // Update real visited map
    visited.forEach(v => this.setVisited(v.x, v.y));

    if (!hasStepped) {
      this.blocked = true;
    }

    return hasChildFlooderStepped || hasStepped;
  }

  get complete(): boolean {
    return (
      this.remainingKeys.length === 0 || this.flooders.some(f => f.complete)
    );
  }

  get completeRoute(): FullCoord[] {
    if (this.remainingKeys.length === 0) {
      return [this.from];
    }
    for (const flooder of this.flooders) {
      if (flooder.complete) {
        return [this.from, ...flooder.completeRoute];
      }
    }
    throw Error("Unable to get complete route from flooder");
  }

  get completeSteps(): number {
    if (this.remainingKeys.length === 0) {
      console.log(`Returning flooder steps:`, this.steps);
      return this.steps;
    }
    for (const flooder of this.flooders) {
      if (flooder.complete) {
        return flooder.completeSteps;
      }
    }
    throw Error("Unable to get complete route from flooder");
  }

  get activeFlooderCount(): number {
    return this.flooders.reduce(
      (sum, f) => sum + f.activeFlooderCount,
      this.blocked ? 0 : 1
    );
  }

  get deadFlooderCount(): number {
    return this.flooders.reduce(
      (sum, f) => sum + f.deadFlooderCount,
      this.blocked ? 1 : 0
    );
  }

  get bestKeyCount(): number {
    return Math.max(
      this.heldKeys.length,
      ...this.flooders.map(f => f.bestKeyCount)
    );
  }
}

const run = (input: string[][]) => {
  const items = input
    .flatMap(line => line.join("").match(/([a-z@])/g) || [])
    .reduce(
      (keyMap, key) => ({ ...keyMap, [key]: positionOf(input, key) }),
      {} as { [key: string]: Coord }
    );
  const start = items[START_CHAR];
  console.log(items);

  if (!start) {
    throw Error("Could not find start character");
  }

  const keys = Object.keys(items).filter(item => KEYS.includes(item));

  const route = new Flooder(input, { ...start, c: START_CHAR }, keys);

  let steps = 0;
  while (!route.complete) {
    steps++;
    if (steps % 10 === 0) {
      console.log(
        "Step:",
        steps,
        `${route.activeFlooderCount}/${route.deadFlooderCount}`,
        `${route.bestKeyCount}/${keys.length}`
      );
    }
    const stepped = route.step(150);
    if (!route.complete && !stepped) {
      // Could not step with any flooders, return null to indicate failure to find route!
      return null;
    }
  }

  console.log(route.completeRoute);
  console.log(route.completeSteps);

  return route.completeSteps;
};

const test = (input: string[][], expectedMinimumSteps: number | null) => {
  const steps = run(input);
  if (steps !== expectedMinimumSteps) {
    throw Error(`Expected: ${expectedMinimumSteps}, Actual: ${steps}`);
  }
  console.log("Test passed. Steps:", steps);
};

const solution: Solution = async () => {
  const input = await getInput;

  return run(input) || NaN;
};

solution.tests = async () => {
  // test(["@....a.b.c".split("")], 9);
  // test(["c....@.a.b".split("")], 13);
  // test(["a....@.b.c".split("")], 13);
  // test(["@....a.b.c".split("")], 9);
  // test(["@aAbBc".split("")], 5);
  // test(["bA@aBc".split("")], 9);
  // test(["a.B............@....b.A.c".split("")], 49);
  // test(["@....A.b.c".split("")], null);
  // test(["@abcdefghji".split("")], 10);
  // test(await getTestInputA, 132);
  // test(await getTestInputB, 136);
  test(await getTestInputC, 81);

  test(
    `##########
#.a###.Ab#
#.B..@.###
#...######
##########`
      .split("\n")
      .map(line => line.split("")),
    1
  );
};

solution.partTwo = async () => {
  const input = await getInput;

  return NaN;
};

solution.inputs = [getInput, getTestInputA, getTestInputB, getTestInputC];

export default solution;
