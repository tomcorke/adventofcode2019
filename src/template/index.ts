import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated(",", "xx", "input").then(values =>
  values.map(toNumber)
);

const solution: Solution = async () => {
  const input = await getInput;

  return NaN;
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

  return NaN;
};

solution.inputs = [getInput];

export default solution;
