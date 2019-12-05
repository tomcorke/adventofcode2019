import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import _ from "lodash";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getInput = readFileSeparated(",", "05", "input").then(r =>
  r.map(toNumber)
);

type Tape = number[];

type ParameterMode = "position" | "immediate";

type OptionalPromise<T> = T | Promise<T>;

interface Op {
  parameters: number;
  func: (
    machine: IntCodeMachine,
    parameters: number[],
    parameterModes: ParameterMode[]
  ) => OptionalPromise<void | number>;
}

interface OpMap {
  [key: number]: Op;
}
const OPS: OpMap = {
  1: {
    // add
    parameters: 3,
    func: ({ tape }, [a, b, out], [modeA, modeB]) => {
      const result =
        getParameter(tape, a, modeA) + getParameter(tape, b, modeB);
      // console.log(`Add result:`, result);
      setParameter(tape, out, result);
    }
  },
  2: {
    // multiply
    parameters: 3,
    func: ({ tape }, [a, b, out], [modeA, modeB]) => {
      const result =
        getParameter(tape, a, modeA) * getParameter(tape, b, modeB);
      // console.log(`Multiply result:`, result);
      setParameter(tape, out, result);
    }
  },
  3: {
    // get input
    parameters: 1,
    func: async ({ tape, inputs }, [a]) => {
      if (inputs.length > 0) {
        const mockInput = inputs.shift()!;
        console.log(`Using mock input: ${mockInput}`);
        setParameter(tape, a, mockInput);
        return;
      }
      return new Promise<void>(resolve => {
        rl.question("Enter value: ", value => {
          setParameter(tape, a, parseInt(value));
          resolve();
        });
      });
    }
  },
  4: {
    // output
    parameters: 1,
    func: async ({ tape, output }, [a], [modeA]) => {
      const result = getParameter(tape, a, modeA);
      output(result);
    }
  }
};

const EXTENDED_OPS: OpMap = {
  ...OPS,
  5: {
    // jump-if-true
    parameters: 2,
    func: ({ tape }, [a, b], [modeA, modeB]) => {
      if (getParameter(tape, a, modeA) !== 0) {
        return getParameter(tape, b, modeB);
      }
    }
  },
  6: {
    // jump-if-false
    parameters: 2,
    func: ({ tape }, [a, b], [modeA, modeB]) => {
      if (getParameter(tape, a, modeA) === 0) {
        return getParameter(tape, b, modeB);
      }
    }
  },
  7: {
    // less-than
    parameters: 3,
    func: ({ tape }, [a, b, out], [modeA, modeB]) => {
      if (getParameter(tape, a, modeA) < getParameter(tape, b, modeB)) {
        setParameter(tape, out, 1);
      } else {
        setParameter(tape, out, 0);
      }
    }
  },
  8: {
    // equals
    parameters: 3,
    func: ({ tape }, [a, b, out], [modeA, modeB]) => {
      if (getParameter(tape, a, modeA) === getParameter(tape, b, modeB)) {
        setParameter(tape, out, 1);
      } else {
        setParameter(tape, out, 0);
      }
    }
  }
};

const getParameter = (tape: Tape, value: number, mode: ParameterMode) => {
  // console.log(
  //   `getParameter`,
  //   value,
  //   mode,
  //   "=",
  //   mode === "position" ? tape[value] : value
  // );
  switch (mode) {
    case "position":
      return tape[value];
    case "immediate":
      return value;
  }
};

const setParameter = (tape: Tape, position: number, value: number) => {
  // console.log("setParameter", position, "=", value);
  tape[position] = value;
};

const toParameterMode = (p: string): ParameterMode => {
  switch (p) {
    case "1":
      return "immediate";
    default:
      return "position";
  }
};

const parseOp = (tape: Tape, pointer: number, opMap: OpMap) => {
  const op = tape[pointer];
  let opString = op.toString();
  const opCode = parseInt(opString.substr(opString.length - 2));

  if (opCode === 99) {
    throw Error("Exit command reached");
  }

  let parameterCount;
  try {
    parameterCount = opMap[opCode].parameters;
  } catch (e) {
    console.error(
      `Error getting parameters for opCode ${opCode} from opString ${opString} at pointer ${pointer}`
    );
    throw e;
  }

  opString = opString.padStart(2 + parameterCount, "0");
  const parameterModeString = opString.substr(0, opString.length - 2);
  // console.log(
  //   `Parsing: `,
  //   opString,
  //   tape.slice(pointer + 1, pointer + 1 + parameterCount),
  //   parameterModeString
  // );

  const parameterModes = Array.from(Array(parameterCount).keys())
    .map(i =>
      parameterModeString.substr(parameterModeString.length - (i + 1), 1)
    )
    .map(toParameterMode);

  return { opCode, parameterCount, parameterModes };
};

class IntCodeMachine {
  public inputs: number[] = [];
  private outputs: number[] = [];

  public tape: Tape;
  private opMap: OpMap;

  private pointer: number = 0;

  constructor(tape: Tape, opMap: OpMap = OPS, mockInputs: number[] = []) {
    this.tape = tape.slice();
    this.opMap = opMap;
    this.inputs = mockInputs.slice();

    this.output = this.output.bind(this);
  }

  output(value: number) {
    // console.log(`Output:`, value);
    if (value !== NaN) {
      this.outputs.push(value);
    }
  }

  runStep = async (): Promise<number> => {
    const { opCode, parameterCount, parameterModes } = parseOp(
      this.tape,
      this.pointer,
      this.opMap
    );
    const parameters = this.tape.slice(
      this.pointer + 1,
      this.pointer + 1 + parameterCount
    );

    // console.log(`Running op:`, opCode, parameters, parameterModes);
    const newPointer = await this.opMap[opCode].func(
      this,
      parameters,
      parameterModes
    );

    const nextPointer = this.pointer + 1 + parameterCount;
    return newPointer || nextPointer;
  };

  public async run() {
    const tapeString = JSON.stringify(this.tape);
    console.log("");
    console.log(
      `Running machine: ${tapeString.substr(0, 40)}${
        tapeString.length > 40 ? "...]" : ""
      }`
    );

    let endProgram = false;
    while (endProgram === false) {
      try {
        this.pointer = await this.runStep();
      } catch (e) {
        console.log(`Program halted:`, e.message);
        endProgram = true;
      }
    }
    return this.outputs.find(o => o !== undefined && o !== NaN);
  }
}

const solution: Solution = async () => {
  const input = await getInput;

  const machine = new IntCodeMachine(input, OPS, [1]);
  const result = await machine.run();

  return result || NaN;
};

const test = async (
  program: string,
  opMap: OpMap,
  mockInputs: number[],
  expectedResult: number
) => {
  const input = program.split(",").map(toNumber);

  console.log("");
  console.log(`Testing, expected result: ${expectedResult}`);
  const machine = new IntCodeMachine(input, opMap, mockInputs);
  const result = await machine.run();

  if (result !== expectedResult) {
    throw Error(
      `Test failed: program "${program}" returned ${result}, expected ${expectedResult}`
    );
  } else {
    console.log("Test passed");
  }
};

solution.partTwo = async () => {
  const input = await getInput;

  // await test("3,9,8,9,10,9,4,9,99,-1,8", EXTENDED_OPS, [8], 1);
  // await test("3,9,7,9,10,9,4,9,99,-1,8", EXTENDED_OPS, [7], 1);
  // await test("3,9,7,9,10,9,4,9,99,-1,8", EXTENDED_OPS, [9], 0);
  // await test("3,3,1108,-1,8,3,4,3,99", EXTENDED_OPS, [8], 1);
  // await test("3,3,1107,-1,8,3,4,3,99", EXTENDED_OPS, [7], 1);
  // await test("3,3,1107,-1,8,3,4,3,99", EXTENDED_OPS, [9], 0);

  const machine = new IntCodeMachine(input, EXTENDED_OPS, [5]);
  const result = await machine.run();

  return result || NaN;
};

export default solution;
