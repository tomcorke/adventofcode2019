import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated("\n", "14", "input");

interface MaterialQuantity {
  material: string;
  quantity: number;
}

interface Reaction {
  inputs: MaterialQuantity[];
  output: MaterialQuantity;
}

const parseMaterialQuantity = (m: string): MaterialQuantity => {
  const [quantityString, material] = m.split(" ");
  return { quantity: parseInt(quantityString), material };
};

const parseReaction = (r: string): Reaction => {
  const [inputString, outputString] = r.split("=>");
  return {
    inputs: inputString
      .split(",")
      .map(i => i.trim())
      .map(parseMaterialQuantity),
    output: parseMaterialQuantity(outputString.trim())
  };
};

const solution: Solution = async () => {
  const input = JSON.parse(JSON.stringify(await getInput));

  const reactions = input.map(parseReaction);

  return NaN;
};

solution.partTwo = async () => {
  const input = JSON.parse(JSON.stringify(await getInput));
  return NaN;
};

solution.inputs = [getInput];

export default solution;
