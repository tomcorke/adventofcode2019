import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated(",", "02", "input").then(results =>
  results.map(toNumber)
);

const STEP = 4;
type Proc = (a: number, b: number) => number;
const PROCS: { [key: number]: Proc } = {
  1: (a, b) => a + b,
  2: (a, b) => a * b
};
type Tape = number[];

const run = (tape: Tape) => {
  let index = 0;
  const outTape = tape.slice();
  while (index < outTape.length && outTape[index] !== 99) {
    const [opcode, aPos, bPos, cPos] = outTape.slice(index, index + STEP);
    const a = outTape[aPos];
    const b = outTape[bPos];
    const r = PROCS[opcode](a, b);
    outTape.splice(cPos, 1, r);
    index += STEP;
  }
  return outTape;
};

const test = (inputTape: Tape, outputTape: Tape) => {
  const testOutput = run(inputTape);
  if (JSON.stringify(testOutput) !== JSON.stringify(outputTape)) {
    console.error(
      `Test error: ${JSON.stringify(inputTape)} => ${JSON.stringify(
        testOutput
      )} !== ${JSON.stringify(outputTape)}`
    );
    throw Error("Test failed");
  }
  console.log(
    `Verified: ${JSON.stringify(inputTape)} => ${JSON.stringify(
      testOutput
    )} === ${JSON.stringify(outputTape)}`
  );
};

const swapVals = (tape: Tape, noun: number, verb: number) => {
  const outTape = tape.slice();
  outTape[1] = noun;
  outTape[2] = verb;
  return outTape;
};

const alarm1202 = (tape: Tape) => {
  return swapVals(tape, 12, 2);
};

const solution: Solution = async () => {
  test([1, 0, 0, 0, 99], [2, 0, 0, 0, 99]);
  test([2, 3, 0, 3, 99], [2, 3, 0, 6, 99]);
  test([2, 4, 4, 5, 99, 0], [2, 4, 4, 5, 99, 9801]);
  test([1, 1, 1, 4, 99, 5, 6, 0, 99], [30, 1, 1, 4, 2, 5, 6, 0, 99]);

  const input = await getInput;

  const result = run(alarm1202(input));

  return result[0];
};

solution.partTwo = async () => {
  for (let noun = 0; noun <= 99; noun += 1) {
    for (let verb = 0; verb <= 99; verb += 1) {
      const input = swapVals(await getInput, noun, verb);
      const result = run(input);
      if (result[0] === 19690720) {
        console.log(noun, verb);
        return 100 * noun + verb;
      }
    }
  }

  return -1;
};

export default solution;
