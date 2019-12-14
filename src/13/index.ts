import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine, EXTENDED_OPS } from "../int-code-machine";

const getInput = readFileSeparated(",", "13", "input").then(values =>
  values.map(toNumber)
);

enum OutputMode {
  X = "x",
  Y = "Y",
  Tile = "tile"
}
const nextOutputMode = (currentMode: OutputMode) => {
  switch (currentMode) {
    case OutputMode.X:
      return OutputMode.Y;
    case OutputMode.Y:
      return OutputMode.Tile;
    case OutputMode.Tile:
      return OutputMode.X;
  }
};

const solution: Solution = async () => {
  const input = (await getInput).slice();

  let outputMode = OutputMode.X;

  let outputX = 0;
  let outputY = 0;
  let tiles: { [x: number]: { [y: number]: number } } = {};

  const machine = new IntCodeMachine(input, EXTENDED_OPS, [], { silent: true });

  machine.onOutput(output => {
    switch (outputMode) {
      case OutputMode.X:
        outputX = output;
        break;
      case OutputMode.Y:
        outputY = output;
        break;
      case OutputMode.Tile:
        tiles[outputX] = tiles[outputX] || {};
        tiles[outputX][outputY] = output;
    }
    outputMode = nextOutputMode(outputMode);
  });

  await machine.run();

  const allTiles = Object.values(tiles).flatMap(col => Object.values(col));

  return allTiles.filter(tile => tile === 2).length;
};

solution.partTwo = async () => {
  const input = (await getInput).slice();
  input[0] = 2;

  let outputMode = OutputMode.X;

  let outputX = 0;
  let outputY = 0;
  let tiles: { [x: number]: { [y: number]: number } } = {};

  let ballX = 0;
  let paddleX = 0;
  let score = 0;

  const machine = new IntCodeMachine(input, EXTENDED_OPS, [], { silent: true });

  machine.onOutput(output => {
    switch (outputMode) {
      case OutputMode.X:
        outputX = output;
        break;
      case OutputMode.Y:
        outputY = output;
        break;
      case OutputMode.Tile:
        if (outputX === -1) {
          score = output;
          break;
        }
        tiles[outputX] = tiles[outputX] || {};
        tiles[outputX][outputY] = output;

        if (output === 3) {
          paddleX = outputX;
        } else if (output === 4) {
          ballX = outputX;
        }
    }
    outputMode = nextOutputMode(outputMode);
  });

  const getJoystickDirection = () => {
    if (ballX < paddleX) {
      return -1;
    } else if (ballX > paddleX) {
      return 1;
    }
    return 0;
  };

  machine.onWaitingForInput(() => {
    machine.input(getJoystickDirection());
  });

  await machine.run();

  return score;
};

solution.inputs = [getInput];

export default solution;
