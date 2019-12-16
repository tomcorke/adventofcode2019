import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated(",", "xx", "input").then(values =>
  values.map(toNumber)
);

const solution: Solution = async () => {
  const input = await getInput;

  return NaN;
};

solution.partTwo = async () => {
  const input = await getInput;

  return NaN;
};

solution.inputs = [getInput];

export default solution;
