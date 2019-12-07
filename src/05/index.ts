import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import _ from "lodash";
import readline from "readline";
import { EventEmitter } from "events";

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
    func: async ({ tape, inputs: inputQueue, onInput }, [a]) => {
      const getInputFromQueue = () => {
        const input = inputQueue.shift()!;
        setParameter(tape, a, input);
        return;
      };
      if (inputQueue.length > 0) {
        return getInputFromQueue();
      }
      return new Promise<void>(resolve => {
        resolve(onInput(getInputFromQueue));
      });
    }
  },
  4: {
    // output
    parameters: 1,
    func: async ({ tape, output }, [a], [modeA]) => {
      const result = getParameter(tape, a, modeA);
      await output(result);
    }
  }
};

export const EXTENDED_OPS: OpMap = {
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

interface IntCodeMachineOptions {
  silent?: boolean;
  pauseOnOutput?: boolean;
}

export class IntCodeMachine {
  private events = new EventEmitter();

  public inputs: number[] = [];
  private outputs: number[] = [];

  private lastInputOrOutput: number | undefined;

  public tape: Tape;
  private opMap: OpMap;

  private pointer: number = 0;
  private running: boolean = false;

  private silent: boolean;
  private pauseOnOutput: boolean;

  constructor(
    tape: Tape,
    opMap: OpMap = OPS,
    inputQueue: number[] = [],
    { silent = false, pauseOnOutput = false }: IntCodeMachineOptions = {}
  ) {
    this.tape = tape.slice();
    this.opMap = opMap;

    this.inputs = inputQueue.slice();
    this.onInput = this.onInput.bind(this);

    this.onOutput = this.onOutput.bind(this);
    this.output = this.output.bind(this);

    this.onHalt = this.onHalt.bind(this);

    this.onOutputOrHalt = this.onOutputOrHalt.bind(this);

    this.silent = silent;
    this.pauseOnOutput = pauseOnOutput;
  }

  input(value: number) {
    this.lastInputOrOutput = value;
    this.inputs.push(value);
    this.events.emit("input");
  }

  onInput(handler: () => void) {
    this.events.once("input", () => handler());
  }

  async output(value: number) {
    if (!this.silent) {
      console.log(`Output:`, value);
    }
    if (value !== NaN) {
      this.lastInputOrOutput = value;
      this.outputs.push(value);
      this.events.emit("output", value);
      if (this.pauseOnOutput) {
        await this.pause();
      }
    }
  }

  onOutput(handler: (output: number) => void) {
    this.events.once("output", (value: number) => handler(value));
  }

  onHalt(handler: (value: number) => void) {
    this.events.once("halt", (value: number) => handler(value));
  }

  onOutputOrHalt(handler: (value: number) => void) {
    this.events.once("output", (value: number) => {
      this.events.removeListener("halt", handler);
      handler(value);
    });
    this.events.removeAllListeners("halt");
    this.events.once("halt", (value: number) => {
      this.events.removeListener("output", handler);
      handler(value);
    });
  }

  async pause() {
    if (!this.silent) {
      console.log("Pausing machine until resume event...");
    }
    await new Promise(resolve => this.events.once("resume", resolve));
  }

  resume() {
    if (!this.silent) {
      console.log("Resuming machine...");
    }
    this.events.emit("resume");
  }

  async runStep() {
    const { opCode, parameterCount, parameterModes } = parseOp(
      this.tape,
      this.pointer,
      this.opMap
    );
    const parameters = this.tape.slice(
      this.pointer + 1,
      this.pointer + 1 + parameterCount
    );

    if (!this.silent) {
      console.log(
        `Running op@${this.pointer}:`,
        opCode,
        parameters,
        parameterModes
      );
    }
    const newPointer = await this.opMap[opCode].func(
      this,
      parameters,
      parameterModes
    );

    const nextPointer = this.pointer + 1 + parameterCount;
    return newPointer || nextPointer;
  }

  get isRunning() {
    return this.running;
  }

  public async run() {
    if (this.running) {
      this.resume();
      return;
    }

    this.running = true;

    const tapeString = JSON.stringify(this.tape);
    if (!this.silent) {
      console.log("");
      console.log(
        `Running machine: ${tapeString.substr(0, 40)}${
          tapeString.length > 40 ? "...]" : ""
        }`
      );
    }

    let endProgram = false;
    while (endProgram === false) {
      try {
        this.pointer = await this.runStep();
      } catch (e) {
        if (!this.silent) {
          console.log(`Program halted:`, e.message);
        }
        endProgram = true;
      }
    }

    this.running = false;

    this.events.emit("halt", this.lastInputOrOutput);

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
