import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import _ from "lodash";
import readline from "readline";
import { IntCodeMachine, EXTENDED_OPS } from "../05";

const getInput = readFileSeparated(",", "07", "input").then(r =>
  r.map(toNumber)
);

const run = async (originalInput: number[], sequence: number[]) => {
  const copyInput = () => originalInput.slice();
  const sequenceCopy = sequence.slice();

  const SILENT = true;

  const inputString = JSON.stringify(originalInput);
  if (!SILENT) {
    console.log(
      `Running machine ${inputString.substr(0, 20)}${
        inputString.length > 20 ? "...]" : ""
      } with sequence ${JSON.stringify(sequence)}`
    );
  }

  let signal = 0;
  while (sequenceCopy.length > 0) {
    const phase = sequenceCopy.shift();
    if (phase === undefined) {
      throw Error("Could not get phase from phase sequence");
    }
    const input = copyInput();
    if (!SILENT) {
      console.log(`Creating machine with [${phase}, ${signal}] inputs`);
    }
    const machine = new IntCodeMachine(input, EXTENDED_OPS, [phase, signal], {
      silent: SILENT
    });
    const result = await machine.run();
    if (result === undefined) {
      throw Error(
        `Unexpected undefined result from IntCodeMachine, phase ${phase}, signal ${signal}`
      );
    }
    signal = result;
  }

  return signal;
};

const test = async (
  inputString: string,
  sequence: number[],
  expectedResult: number
) => {
  const result = await run(inputString.split(",").map(toNumber), sequence);
  if (result !== expectedResult) {
    throw Error(`Test failed, expected ${expectedResult}, received ${result}`);
  }
  console.log("Test passed");
};

function* getPhaseCombinations<T>(values: T[]) {
  const maxLength = values.length;

  function* getValueSequence() {
    for (let i = 0; i < values.length; i++) {
      yield values[i];
    }
  }

  function* getPhases(currentPhases: T[], index: number): Generator<T[]> {
    for (const n of getValueSequence()) {
      if (!currentPhases.includes(n)) {
        const p = [...currentPhases, n];
        if (index === maxLength - 1) {
          yield p;
        } else {
          yield* getPhases(p, index + 1);
        }
      }
    }
  }

  for (const phases of getPhases([], 0)) {
    yield phases;
  }
}

const solution: Solution = async () => {
  await test(
    "3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0",
    [4, 3, 2, 1, 0],
    43210
  );
  await test(
    "3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0",
    [0, 1, 2, 3, 4],
    54321
  );
  await test(
    "3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0",
    [1, 0, 4, 3, 2],
    65210
  );

  const input = (await getInput).slice();

  let maxSignal = 0;
  let maxPhases: number[] | undefined;

  for await (const phases of getPhaseCombinations([0, 1, 2, 3, 4])) {
    const signal = await run(input, phases);
    if (signal > maxSignal) {
      maxSignal = signal;
      maxPhases = phases.slice();
    }
  }

  console.log({ maxSignal, maxPhases });

  return maxSignal;
};

const run2 = async (originalInput: number[], sequence: number[]) => {
  const copyInput = () => originalInput.slice();
  const sequenceCopy = sequence.slice();

  const inputString = JSON.stringify(originalInput);

  const SILENT = true;

  if (!SILENT) {
    console.log(
      `Running machine ${inputString.substr(0, 20)}${
        inputString.length > 20 ? "...]" : ""
      } with sequence ${JSON.stringify(sequence)}`
    );
  }

  let signal = 0;

  const machines = sequence.map(phase => {
    const input = copyInput();
    if (!SILENT) {
      console.log(`Creating machine with inputs [${phase}]`);
    }
    const machine = new IntCodeMachine(input, EXTENDED_OPS, [phase], {
      silent: true,
      pauseOnOutput: true
    });
    return machine;
  });

  let machineIndex = 0;
  let running = true;

  while (running) {
    if (!SILENT) {
      console.log(`Running machine at index ${machineIndex}`);
    }
    const machine = machines[machineIndex];
    const machineOutput = new Promise<number>(resolve => {
      const outputHandler = (value: number) => resolve(value);
      machine.onOutputOrHalt(outputHandler);
    });

    if (!machine.isRunning) {
      machine.run();
    } else {
      machine.resume();
    }
    if (!SILENT) {
      console.log(`Sending signal ${signal} to machine ${machineIndex}`);
    }
    machine.input(signal);
    if (!SILENT) {
      console.log("Waiting for machine output...");
    }
    signal = await machineOutput;
    if (!SILENT) {
      console.log(`Got machine output ${signal}`);
    }

    if (!machine.isRunning) {
      if (!SILENT) {
        console.log(
          `Machine ${machineIndex} has halted, using last output: ${signal}`
        );
      }
      running = false;
      break;
    }

    machineIndex++;
    if (machineIndex >= machines.length) {
      machineIndex = 0;
    }
  }

  return signal;
};

const test2 = async (
  inputString: string,
  sequence: number[],
  expectedResult: number
) => {
  const result = await run2(inputString.split(",").map(toNumber), sequence);
  if (result !== expectedResult) {
    throw Error(`Test failed, expected ${expectedResult}, received ${result}`);
  }
  console.log("Test passed");
};

solution.partTwo = async () => {
  const input = (await getInput).slice();

  await test2(
    "3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5",
    [9, 8, 7, 6, 5],
    139629729
  );
  await test2(
    "3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10",
    [9, 7, 8, 5, 6],
    18216
  );

  let maxSignal = 0;
  let maxPhases: number[] | undefined;

  for await (const phases of getPhaseCombinations([5, 6, 7, 8, 9])) {
    const signal = await run2(input, phases);
    if (signal > maxSignal) {
      maxSignal = signal;
      maxPhases = phases.slice();
    }
  }

  console.log({ maxSignal, maxPhases });

  return maxSignal;
};

solution.inputs = [getInput];

export default solution;
