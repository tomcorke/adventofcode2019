import { readFileSeparated, toNumber, readFile } from "../helpers";
import { Solution } from "..";

const getInput = readFile("16", "input");

const BASE_PATTERN = [0, 1, 0, -1];

const getPattern = (element: number) => {
  const pattern = BASE_PATTERN.flatMap(n => Array.from(Array(element)).fill(n));
  const first = pattern.shift();
  return [...pattern, first];
};

const phase = (signal: string) => {
  const signalAsNumbers = signal.split("").map(toNumber);
  return signalAsNumbers
    .map((n, i) => {
      const pattern = getPattern(i + 1);
      const pl = pattern.length;
      return signalAsNumbers
        .map((sn, si) => {
          return sn * pattern[si % pl];
        })
        .reduce((sum, sn) => sum + sn, 0);
    })
    .map(n => Math.abs(n % 10).toString())
    .join("");
};

const reversePhase = (signal: string, from: number) => {
  const signalAsNumbers = signal.split("").map(toNumber);
  const length = signalAsNumbers.length;
  let sum = 0;
  for (let i = length - 1; i >= from; i--) {
    sum = (sum + signalAsNumbers[i]) % 10;
    signalAsNumbers[i] = sum;
  }
  return signalAsNumbers.join("");
};

const test = (input: string, expectedOutput: string) => {
  const phased = phase(input);
  if (phased !== expectedOutput) {
    throw Error(
      `Expected phased value for input "${input}" to equal "${expectedOutput}", actual was "${phased}"`
    );
  }
};

const testFirst8 = (input: string, expectedFirst8: string) => {
  let phased = input;
  for (let n = 0; n < 100; n++) {
    phased = phase(phased);
  }
  const first8 = phased.substr(0, 8);
  if (first8 !== expectedFirst8) {
    throw Error(
      `Expected first 8 characters for 100x phased input "${input}" to equal "${expectedFirst8}", actual was "${first8}"`
    );
  }
};

const solution: Solution = async () => {
  const input = await getInput;

  test("12345678", "48226158");
  test("48226158", "34040438");
  test("34040438", "03415518");
  test("03415518", "01029498");

  // testFirst8("80871224585914546619083218645595", "24176176");
  // testFirst8("19617804207202209144916044189917", "73745418");
  // testFirst8("69317163492948606335995924319873", "52432133");

  let phased = input;
  for (let n = 0; n < 100; n++) {
    phased = phase(phased);
  }
  const first8 = phased.substr(0, 8);

  console.log(first8);

  return parseInt(first8);
};

solution.partTwo = async () => {
  const input = await getInput;

  const offset = parseInt(input.substr(0, 7));
  console.log("offset", offset);

  let phased = input.repeat(10000);
  console.log("input length", phased.length);
  for (let n = 0; n < 100; n++) {
    phased = reversePhase(phased, offset);
  }
  const result = phased.substr(offset, 8);
  console.log(result);
  return parseInt(result);
};

solution.inputs = [getInput];

export default solution;
