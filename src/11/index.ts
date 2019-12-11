import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import {
  IntCodeMachine,
  EXTENDED_OPS,
  IntCodeMachineOptions
} from "../int-code-machine";

const getInput = readFileSeparated(",", "11", "input").then(values =>
  values.map(toNumber)
);

enum OutputMode {
  COLOR = "color",
  TURN = "turn"
}

enum Direction {
  UP = "up",
  RIGHT = "right",
  DOWN = "down",
  LEFT = "left"
}

const turnAnticlockwise = (direction: Direction) => {
  switch (direction) {
    case Direction.UP:
      return Direction.LEFT;
    case Direction.RIGHT:
      return Direction.UP;
    case Direction.DOWN:
      return Direction.RIGHT;
    case Direction.LEFT:
      return Direction.DOWN;
  }
};

const turnClockwise = (direction: Direction) => {
  switch (direction) {
    case Direction.UP:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.LEFT;
    case Direction.LEFT:
      return Direction.UP;
  }
};

const move = (x: number, y: number, direction: Direction) => {
  switch (direction) {
    case Direction.UP:
      return [x, y - 1];
    case Direction.RIGHT:
      return [x + 1, y];
    case Direction.DOWN:
      return [x, y + 1];
    case Direction.LEFT:
      return [x - 1, y];
  }
};

interface RobotOptions extends IntCodeMachineOptions {
  startPanelColor?: boolean;
}

class HullPaintingRobot {
  private program: number[];
  private options: RobotOptions = {};

  public panelMap: { [x: number]: { [y: number]: boolean } } = {};
  private paintedPanels: { [x: number]: number[] } = {};
  private paintColor: boolean = false;
  private x: number = 0;
  private y: number = 0;
  private direction: Direction = Direction.UP;

  private machineOutputMode: OutputMode = OutputMode.COLOR;

  constructor(program: number[], options: RobotOptions = {}) {
    this.program = program.slice();
    this.options = options;

    if (options.startPanelColor) {
      this.panelMap = { [0]: { [0]: options.startPanelColor } };
    }
  }

  private getColor() {
    if (!this.panelMap[this.x]) {
      return false;
    }
    return !!this.panelMap[this.x][this.y];
  }

  private paint() {
    const x = this.x;
    const y = this.y;

    if (!this.panelMap[x]) {
      this.panelMap[x] = {};
    }
    const currentValue = !!this.panelMap[x][y];
    if (currentValue !== this.paintColor) {
      if (!this.paintedPanels[x]) {
        this.paintedPanels[x] = [];
      }
      if (!this.paintedPanels[x].includes(y)) {
        this.paintedPanels[x].push(y);
      }
    }
    this.panelMap[x][y] = this.paintColor;
  }

  public getPaintedPanels() {
    return Object.values(this.paintedPanels).reduce(
      (sum, panelsInX) => sum + panelsInX.length,
      0
    );
  }

  private move() {
    const [x, y] = move(this.x, this.y, this.direction);
    this.x = x;
    this.y = y;
  }

  private swapOutputMode() {
    switch (this.machineOutputMode) {
      case OutputMode.COLOR:
        return (this.machineOutputMode = OutputMode.TURN);
      case OutputMode.TURN:
        return (this.machineOutputMode = OutputMode.COLOR);
    }
  }

  public async run() {
    this.machineOutputMode = OutputMode.COLOR;

    this.x = 0;
    this.y = 0;
    this.paintColor = false;
    this.direction = Direction.UP;

    const machine = new IntCodeMachine(
      this.program.slice(),
      EXTENDED_OPS,
      [],
      this.options
    );

    machine.onOutput(output => {
      switch (this.machineOutputMode) {
        case OutputMode.COLOR:
          this.paintColor = !!output;
          this.paint();
          this.swapOutputMode();
          return;
        case OutputMode.TURN:
          if (output === 0) {
            this.direction = turnAnticlockwise(this.direction);
          } else {
            this.direction = turnClockwise(this.direction);
          }
          this.move();
          this.swapOutputMode();
          return;
      }
    });

    machine.onWaitingForInput(() => {
      machine.input(this.getColor() ? 1 : 0);
    });

    const result = await machine.run();
    return this.getPaintedPanels();
  }
}

const solution: Solution = async () => {
  const input = await getInput;

  const robot = new HullPaintingRobot(input, { silent: true });
  const result = await robot.run();

  return result;
};

solution.partTwo = async () => {
  const input = await getInput;

  const robot = new HullPaintingRobot(input, {
    silent: true,
    startPanelColor: true
  });
  const result = await robot.run();

  const paint = robot.panelMap;

  const xValues = Object.keys(paint).map(toNumber);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  const yValues = Object.values(paint).flatMap(x =>
    Object.keys(x).map(toNumber)
  );
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  for (let y = minY; y <= maxY; y++) {
    const row = Array.from(Array(maxX - minX))
      .map((v, x) => {
        return paint[x + minX] && paint[x + minX][y] ? "█" : " ";
      })
      .join("");
    console.log(row);
  }

  return result;
};

solution.inputs = [getInput];

export default solution;
