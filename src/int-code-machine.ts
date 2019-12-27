import _ from "lodash";
import readline from "readline";
import { EventEmitter } from "events";
import { addListener } from "cluster";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

type Tape = number[];

type ParameterMode = "position" | "immediate" | "relative";

type OptionalPromise<T> = T | Promise<T>;

interface Op {
  parameters: number;
  func: (
    machine: IntCodeMachine,
    parameters: number[],
    parameterModes: ParameterMode[]
  ) => OptionalPromise<void | number>;
}

export interface OpMap {
  [key: number]: Op;
}

export const OPS: OpMap = {
  1: {
    // add
    parameters: 3,
    func: (machine, [a, b, out], [modeA, modeB, modeOut]) => {
      const result =
        machine.getParameter(a, modeA) + machine.getParameter(b, modeB);
      // console.log(`Add result:`, result);
      machine.setParameter(out, result, modeOut);
    }
  },
  2: {
    // multiply
    parameters: 3,
    func: (machine, [a, b, out], [modeA, modeB, modeOut]) => {
      const result =
        machine.getParameter(a, modeA) * machine.getParameter(b, modeB);
      // console.log(`Multiply result:`, result);
      machine.setParameter(out, result, modeOut);
    }
  },
  3: {
    // get input
    parameters: 1,
    func: async (machine, [a], [mode]) => {
      const getInputFromQueue = () => {
        const input = machine.inputs.shift()!;
        machine.setParameter(a, input, mode);
        return;
      };
      if (machine.inputs.length > 0) {
        machine.setIdle(false);
        return getInputFromQueue();
      }
      if (machine.defaultInput !== undefined) {
        machine.setIdle(true);
        machine.setParameter(a, machine.defaultInput, mode);
        return;
      }
      return new Promise<void>(resolve => {
        machine.onInputOnce(() => {
          machine.setWaitingForInput(false);
          resolve(getInputFromQueue());
        });
        machine.setWaitingForInput(true);
      });
    }
  },
  4: {
    // output
    parameters: 1,
    func: async (machine, [a], [modeA]) => {
      const result = machine.getParameter(a, modeA);
      await machine.output(result);
    }
  },
  5: {
    // jump-if-true
    parameters: 2,
    func: (machine, [a, b], [modeA, modeB]) => {
      if (machine.getParameter(a, modeA) !== 0) {
        return machine.getParameter(b, modeB);
      }
    }
  },
  6: {
    // jump-if-false
    parameters: 2,
    func: (machine, [a, b], [modeA, modeB]) => {
      if (machine.getParameter(a, modeA) === 0) {
        return machine.getParameter(b, modeB);
      }
    }
  },
  7: {
    // less-than
    parameters: 3,
    func: (machine, [a, b, out], [modeA, modeB, modeOut]) => {
      if (machine.getParameter(a, modeA) < machine.getParameter(b, modeB)) {
        machine.setParameter(out, 1, modeOut);
      } else {
        machine.setParameter(out, 0, modeOut);
      }
    }
  },
  8: {
    // equals
    parameters: 3,
    func: (machine, [a, b, out], [modeA, modeB, modeOut]) => {
      if (machine.getParameter(a, modeA) === machine.getParameter(b, modeB)) {
        machine.setParameter(out, 1, modeOut);
      } else {
        machine.setParameter(out, 0, modeOut);
      }
    }
  },
  9: {
    // adjust relative base
    parameters: 1,
    func: (machine, [a], [modeA]) => {
      const value = machine.getParameter(a, modeA);
      machine.adjustRelativeBase(value);
    }
  }
};

const OP_NAMES: { [key: number]: string } = {
  1: "add",
  2: "multiply",
  3: "get-input",
  4: "output",
  5: "jump-if-true",
  6: "jump-if-false",
  7: "less-than",
  8: "equals",
  9: "adjust-relative-base"
};

const toParameterMode = (p: string): ParameterMode => {
  switch (p) {
    case "1":
      return "immediate";
    case "2":
      return "relative";
    default:
      return "position";
  }
};

const parseOp = (tape: Tape, pointer: number) => {
  const op = tape[pointer];
  if (op === undefined) {
    throw Error(`Undefined opcode at position ${pointer}`);
  }
  let opString = op.toString();
  const opCode = parseInt(opString.substr(opString.length - 2));

  if (opCode === 99) {
    throw Error("Exit command reached");
  }

  let parameterCount;
  try {
    parameterCount = OPS[opCode].parameters;
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

export interface IntCodeMachineOptions {
  silent?: boolean;
  pauseOnOutput?: boolean;
  defaultInput?: number;
  label?: string;
}

export class IntCodeMachine {
  private events = new EventEmitter();

  public label?: string;

  public inputs: number[] = [];
  private outputs: number[] = [];

  private lastInputOrOutput: number | undefined;

  public tape: Tape;

  private pointer: number = 0;
  private relativeBase: number = 0;

  private running: boolean = false;
  private paused: boolean = false;
  private shouldHalt: boolean = false;

  private silent: boolean;
  private pauseOnOutput: boolean;
  public defaultInput?: number;

  public isWaitingForInput: boolean = false;
  public isIdle: boolean = false;

  constructor(
    tape: Tape,
    inputQueue: number[] = [],
    {
      silent = true,
      pauseOnOutput = false,
      defaultInput,
      label
    }: IntCodeMachineOptions = {}
  ) {
    this.tape = tape.slice();

    this.inputs = inputQueue.slice();

    this.silent = silent;
    this.pauseOnOutput = pauseOnOutput;
    this.defaultInput = defaultInput;
    this.label = label;
  }

  public getLastInputOrOutput() {
    return this.lastInputOrOutput;
  }

  input(value: number | string) {
    if (typeof value === "string") {
      value.split("").forEach(c => this.input(c.charCodeAt(0)));
      return;
    }
    this.lastInputOrOutput = value;
    this.inputs.push(value);
    this.events.emit("input");
  }

  onInputOnce(handler: () => void) {
    this.events.once("input", () => handler());
  }

  onWaitingForInput(handler: () => void) {
    this.events.on("waitingForInput", () => handler());
  }

  onStopWaitingForInput(handler: () => void) {
    this.events.on("stopWaitingForInput", () => handler());
  }

  setWaitingForInput(isWaitingForInput: boolean = true) {
    this.isWaitingForInput = isWaitingForInput;
    if (isWaitingForInput) {
      this.events.emit("waitingForInput");
    } else {
      this.events.emit("stopWaitinForInput");
    }
  }

  onIdle(handler: (isIdle: boolean) => void) {
    this.events.on("idle", () => handler(this.isIdle));
  }

  setIdle(isIdle: boolean = true) {
    if (this.isIdle !== isIdle) {
      this.isIdle = isIdle;
      this.events.emit("idle");
    }
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
    this.events.on("output", (value: number) => handler(value));
  }

  onOutputOnce(handler: (output: number) => void) {
    this.events.once("output", (value: number) => handler(value));
  }

  onHaltOnce(handler: (value: number) => void) {
    this.events.once("halt", (value: number) => handler(value));
  }

  onOutputOrHaltOnce(handler: (value: number) => void) {
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
    this.paused = true;
  }

  resume() {
    if (!this.silent) {
      console.log("Resuming machine...");
    }
    this.events.emit("resume");
  }

  adjustRelativeBase(value: number) {
    if (!this.silent) {
      console.log(`Adjust relative base: ${value}`);
    }
    this.relativeBase = this.relativeBase + value;
  }

  getParameter(value: number, mode: ParameterMode) {
    if (!this.silent) {
      console.log(
        `getParameter`,
        value,
        mode,
        "=",
        mode === "position"
          ? this.tape[value]
          : mode === "relative"
          ? this.tape[this.relativeBase + value]
          : value
      );
    }
    switch (mode) {
      case "position":
        return this.tape[value] || 0;
      case "immediate":
        return value || 0;
      case "relative":
        return this.tape[this.relativeBase + value] || 0;
    }
  }

  setParameter(position: number, value: number, mode: ParameterMode) {
    if (!this.silent) {
      console.log(
        "setParameter",
        mode,
        mode === "position" ? position : this.relativeBase + position,
        "=",
        value
      );
    }
    switch (mode) {
      case "position":
        return (this.tape[position] = value);
      case "relative":
        return (this.tape[this.relativeBase + position] = value);
    }
    throw Error(`Unsupported parameter mode ${mode} for setParameter`);
  }

  async runStep() {
    if (this.paused) {
      await new Promise(resolve => this.events.once("resume", resolve));
    }

    const { opCode, parameterCount, parameterModes } = parseOp(
      this.tape,
      this.pointer
    );
    const parameters = this.tape.slice(
      this.pointer + 1,
      this.pointer + 1 + parameterCount
    );

    if (!this.silent) {
      console.log(
        `Running op@${this.pointer}:`,
        OP_NAMES[opCode],
        opCode,
        parameters,
        parameterModes
      );
    }
    const newPointer = await OPS[opCode].func(this, parameters, parameterModes);

    const nextPointer = this.pointer + 1 + parameterCount;
    return newPointer !== undefined ? newPointer : nextPointer;
  }

  get isRunning() {
    return this.running;
  }

  public halt() {
    this.shouldHalt = true;
  }

  public async run(): Promise<number[]> {
    if (this.running) {
      throw Error("Machine is already running");
    }

    this.running = true;

    const tapeString = JSON.stringify(this.tape);
    if (!this.silent) {
      console.log(
        `Running machine: ${tapeString.substr(0, 40)}${
          tapeString.length > 40 ? "...]" : ""
        }`
      );
    }

    let endProgram = false;
    while (endProgram === false) {
      try {
        if (this.shouldHalt) {
          throw Error("Manual halt flag detected");
        }
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

    return this.outputs;
  }
}
