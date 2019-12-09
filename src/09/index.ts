import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine, EXTENDED_OPS } from "../int-code-machine";

const getInput = readFileSeparated(",", "09", "input").then(values =>
  values.map(toNumber)
);

type CheckFunction = (result: string) => void;
const equals: (expected: string) => CheckFunction = (
  expected: string
) => result => {
  if (result !== expected) {
    throw Error(
      `Result of ${result} does not match expected result of ${expected}`
    );
  }
};

const test = async (inputString: string, check: CheckFunction) => {
  const machine = new IntCodeMachine(
    inputString.split(",").map(toNumber),
    EXTENDED_OPS,
    [],
    { silent: true }
  );
  const result = await machine.run();
  const resultString = result.map(r => r.toString()).join(",");
  check(resultString);
  console.log(`Test passed for program ${inputString}`);
};

const solution: Solution = async () => {
  await test(
    "109,1,204,-1,1001,100,1,100,1008,100,16,101,1006,101,0,99",
    equals("109,1,204,-1,1001,100,1,100,1008,100,16,101,1006,101,0,99")
  );
  await test("1102,34915192,34915192,7,4,7,99,0", result => {
    if (result.length !== 16) {
      throw Error(`Result of ${result} is not a 16-digit number`);
    }
  });
  await test("104,1125899906842624,99", equals("1125899906842624"));

  const machine = new IntCodeMachine(await getInput, EXTENDED_OPS, [1], {
    silent: true
  });
  const results = await machine.run();

  console.log(results);
  return results[0];
};

solution.partTwo = async () => {
  const machine = new IntCodeMachine(await getInput, EXTENDED_OPS, [2], {
    silent: true
  });
  const results = await machine.run();

  console.log(results);
  return results[0];
};

solution.inputs = [getInput];

export default solution;
