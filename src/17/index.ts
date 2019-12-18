import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine } from "../int-code-machine";

const getInput = readFileSeparated(",", "17", "input").then(values =>
  values.map(toNumber)
);

class ScaffoldMap {
  public map: string[][] = [];

  private mapPointerX = 0;
  private mapPointerY = 0;

  public addToMap(asciiValue: number) {
    const add = (stringValue: string) => {
      if (!this.map[this.mapPointerY]) {
        this.map[this.mapPointerY] = [];
      }
      this.map[this.mapPointerY][this.mapPointerX] = stringValue;
      this.mapPointerX++;
    };

    if (asciiValue === 10) {
      this.mapPointerX = 0;
      this.mapPointerY++;
      return;
    }

    return add(String.fromCharCode(asciiValue));
  }

  clear() {
    this.map = [];
  }

  render() {
    this.map.forEach(y => console.log(y.join("")));
  }

  findIntersections() {
    const get = (x: number, y: number) => {
      if (!this.map[y]) {
        return " ";
      }
      return this.map[y][x] || " ";
    };

    const getAround = (x: number, y: number) => {
      return [
        get(x, y - 1),
        get(x - 1, y),
        get(x, y),
        get(x + 1, y),
        get(x, y + 1)
      ].join("");
    };

    let intersections: [number, number][] = [];

    for (let y = 1; y < this.map.length - 1; y++) {
      for (let x = 1; x < this.map[y].length - 1; x++) {
        if (getAround(x, y) === "#####") {
          intersections.push([x, y]);
        }
      }
    }

    return intersections;
  }
}

const solution: Solution = async () => {
  const input = await getInput;

  const machine = new IntCodeMachine(input, [], { silent: true });
  const map = new ScaffoldMap();
  machine.onOutput(output => {
    try {
      map.addToMap(output);
    } catch (e) {
      console.error(e);
      machine.halt();
    }
  });
  await machine.run();
  map.render();

  const intersections = map.findIntersections();

  console.log(intersections);

  return intersections
    .map(([x, y]) => x * y)
    .reduce((sum, value) => sum + value);
};

solution.partTwo = async () => {
  const input = await getInput;

  // Rebuild map for part 2
  const mapBuildingMachine = new IntCodeMachine(input, [], { silent: true });
  const map = new ScaffoldMap();
  mapBuildingMachine.onOutput(output => {
    try {
      map.addToMap(output);
    } catch (e) {
      console.error(e);
      mapBuildingMachine.halt();
    }
  });
  await mapBuildingMachine.run();

  const switchedInput = input.slice();
  switchedInput[0] = 2;
  const robotMachine = new IntCodeMachine(switchedInput, [], { silent: true });

  robotMachine.input(`C,C,A,B,A,B,A,B,C,B
R,4,R,6,R,6,R,4,R,4
L,8,R,6,L,10,L,10
R,6,L,8,R,8
y
`);

  const mapLines = map.map.length + 1;
  let renderedLines = -6;
  robotMachine.onOutput(output => {
    if (output === 10) {
      renderedLines++;
      if (renderedLines % mapLines === 0) {
        console.log("--", renderedLines, renderedLines / mapLines);
        map.render();
        map.clear();
        return;
      }
    }
    map.addToMap(output);
  });

  robotMachine.onWaitingForInput(() => {
    console.log("Waiting for input...");
  });

  map.clear();
  await robotMachine.run();

  console.log(robotMachine.getLastInputOrOutput());

  return NaN;
};

solution.inputs = [getInput];

export default solution;
