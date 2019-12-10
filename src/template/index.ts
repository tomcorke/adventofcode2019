import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated(",", "xx", "input").then(values =>
  values.map(toNumber)
);

const solution: Solution = async () => {
  return NaN;
};

solution.partTwo = async () => {
  return NaN;
};

solution.inputs = [getInput];

export default solution;
