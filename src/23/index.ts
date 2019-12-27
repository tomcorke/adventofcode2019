import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import { IntCodeMachine } from "../int-code-machine";

const getInput = readFileSeparated(",", "23", "input").then(values =>
  values.map(toNumber)
);

const solution: Solution = async () => {
  const input = await getInput;

  const machines: IntCodeMachine[] = [];

  const haltAll = () => machines.forEach(m => m.halt());

  let result: number = NaN;

  await Promise.all(
    Array.from(new Array(50).keys()).map(i => {
      console.log("Making machine", i);
      const machine = new IntCodeMachine(input, [i], {
        defaultInput: -1,
        label: i.toString()
      });
      let outputPhase = 0;
      let outputs: number[] = [];
      machine.onOutput(output => {
        outputs.push(output);
        outputPhase++;
        if (outputPhase === 3) {
          console.log(
            parseInt(machine.label || ""),
            "send",
            `${outputs[1]},${outputs[2]}`,
            "to",
            outputs[0]
          );
          if (outputs[0] === 255) {
            haltAll();
            console.log("");
            console.log("Y signal sent to 255:", outputs[2]);
            result = outputs[0];
          }
          machines[outputs[0]].input(outputs[1]);
          machines[outputs[0]].input(outputs[2]);
          outputs = [];
          outputPhase = 0;
        }
      });
      machines.push(machine);
      return machine.run();
    })
  );

  return result;
};

solution.partTwo = async () => {
  const input = await getInput;

  const machines: IntCodeMachine[] = [];

  const haltAll = () => machines.forEach(m => m.halt());

  let result: number = NaN;

  let lastSignalX: number = 0;
  let lastSignalY: number = 0;

  let idleMachines = 0;

  await Promise.all(
    Array.from(new Array(50).keys()).map(i => {
      console.log("Making machine", i);
      const machine = new IntCodeMachine(input, [i], {
        defaultInput: -1,
        label: i.toString()
      });
      let outputPhase = 0;
      let outputs: number[] = [];

      machine.onOutput(output => {
        outputs.push(output);
        outputPhase++;
        if (outputPhase === 3) {
          console.log(
            parseInt(machine.label || ""),
            "send",
            `${outputs[1]},${outputs[2]}`,
            "to",
            outputs[0]
          );
          if (outputs[0] === 255) {
            console.log("");
            console.log("X signal sent to 255:", outputs[1]);
            console.log("Y signal sent to 255:", outputs[2]);

            lastSignalX = outputs[1];
            lastSignalY = outputs[2];
          } else {
            machines[outputs[0]].input(outputs[1]);
            machines[outputs[0]].input(outputs[2]);
          }
          outputs = [];
          outputPhase = 0;
        }
      });

      machine.onIdle(isIdle => {
        console.log(parseInt(machine.label || ""), "idle", isIdle);
        if (isIdle) {
          idleMachines++;
        } else {
          idleMachines--;
        }
        console.log("Idle machines", idleMachines);
        if (idleMachines === 50) {
          console.log(
            "All machines idle, forwarding packet to 0",
            lastSignalX,
            lastSignalY
          );

          if (lastSignalY === result) {
            haltAll();
            console.log("Duplicate Y signal sent to 0 detected", result);
          }

          result = lastSignalY;
          machines[0].input(lastSignalX);
          machines[0].input(lastSignalY);
        }
      });

      machines.push(machine);
      return machine.run();
    })
  );

  return result;
};

solution.inputs = [getInput];

export default solution;
