import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine } from "../int-code-machine";

const getInput = readFileSeparated(",", "21", "input").then(values =>
  values.map(toNumber)
);

const solution: Solution = async () => {
  const input = await getInput;

  const machine = new IntCodeMachine(input);

  machine.input(`NOT C J
AND D J
NOT A T
OR T J
WALK
`);

  let damage = 0;
  let allOutput = "";

  machine.onOutput(output => {
    if (output > 200) {
      console.log(output, String.fromCharCode(output));
      damage += output;
    } else {
      allOutput = allOutput + String.fromCharCode(output);
    }
  });

  await machine.run();

  console.log(allOutput);

  return damage;
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

  const machine = new IntCodeMachine(input);

  machine.input(
    `NOT A T
  NOT B J
  OR T J
  NOT C T
  OR T J
  AND D J
  AND E T
  OR H T
  AND T J
RUN
`
  );

  let damage = 0;
  let allOutput = "";

  machine.onOutput(output => {
    if (output > 200) {
      console.log(output, String.fromCharCode(output));
      damage += output;
    } else {
      allOutput = allOutput + String.fromCharCode(output);
    }
  });

  await machine.run();

  console.log(allOutput);

  return damage;
};

solution.inputs = [getInput];

export default solution;
