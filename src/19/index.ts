import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine } from "../int-code-machine";

const getInput = readFileSeparated(",", "19", "input").then(values =>
  values.map(toNumber)
);

const solution: Solution = async () => {
  const input = await getInput;

  let movingCount = 0;

  let plot: string[][] = [];

  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      plot[y] = plot[y] || [];
      const machine = new IntCodeMachine(input, [x, y], { silent: true });
      const result = await machine.run();
      if (result[0] === 1) {
        plot[y][x] = "#";
        movingCount++;
      } else {
        plot[y][x] = ".";
      }
    }
  }

  plot.forEach(line => console.log(line.join("")));

  return movingCount;
};

const test = async <T>(
  pendingInput: typeof getInput,
  expectedResult: T
): Promise<void> => {
  const input = await pendingInput;
  const actual: T = 123 as any;
  if (actual !== expectedResult) {
    throw Error(
      `Test failed, expected result ${expectedResult}, actual result ${actual}`
    );
  }
};

solution.tests = async () => {
  await test(getInput, 123);
};

solution.partTwo = async () => {
  const input = await getInput;

  let x = 0;
  let y = 3;

  const check = async (x: number, y: number) => {
    const machine = new IntCodeMachine(input, [x, y], { silent: true });
    const [result] = await machine.run();
    return !!result;
  };

  while (true) {
    x++;
    const result = await check(x, y);
    if (result) {
      if (
        (await check(x + 99, y - 99)) &&
        (await check(x, y - 99)) &&
        (await check(x + 99, y))
      ) {
        console.log(`Square found at ${x},${y - 99}`);
        y = y - 99;
        break;
      }
      y++;
      x--;
    }
  }

  return x * 10000 + y;
};

solution.inputs = [getInput];

export default solution;
