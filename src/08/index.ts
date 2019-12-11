import { readFileSeparated, toNumber, readFile } from "../helpers";
import { Solution } from "..";
import _ from "lodash";

const LAYER_WIDTH = 25;
const LAYER_HEIGHT = 6;

const LAYER_SIZE = LAYER_WIDTH * LAYER_HEIGHT;

const splitByLength = (input: string, length: number) => {
  const splits: string[] = [];
  for (let i = 0; i < input.length; i += length) {
    splits.push(input.substr(i, length));
  }
  return splits;
};

const getInput = readFile("08", "input").then(input => {
  return splitByLength(input, LAYER_SIZE);
});

const solution: Solution = async () => {
  const layers = (await getInput).slice();

  const countCharacter = (layer: string, character: string) => {
    const matches = layer.match(new RegExp(character, "g"));
    return matches ? matches.length : 0;
  };
  const countZeroes = (layer: string) => countCharacter(layer, "0");

  const layerWithFewestZeroes = layers.sort(
    (a, b) => countZeroes(a) - countZeroes(b)
  )[0];

  console.log(countZeroes(layerWithFewestZeroes));

  return (
    countCharacter(layerWithFewestZeroes, "1") *
    countCharacter(layerWithFewestZeroes, "2")
  );
};

solution.partTwo = async () => {
  const layers = (await getInput).slice();

  const splitLayers = layers.map(layer => layer.split(""));

  const flatten = (layerValues: string[]) => {
    let finalValue = "1";
    for (let i = layerValues.length - 1; i >= 0; i--) {
      switch (layerValues[i]) {
        case "0":
          finalValue = "0";
          break;
        case "1":
          finalValue = "1";
          break;
      }
    }
    if (!["1", "0"].includes(finalValue)) {
      throw Error(`Unexpected flattened value: ${finalValue}`);
    }
    return finalValue;
  };

  const splitFlatLayer: string[] = [];
  for (let i = 0; i < LAYER_SIZE; i++) {
    splitFlatLayer.push(flatten(splitLayers.map(l => l[i])));
  }

  const flatLayerLines = splitByLength(
    splitFlatLayer.map(l => (l === "1" ? "█" : " ")).join(""),
    LAYER_WIDTH
  );

  flatLayerLines.forEach(line => console.log(line));

  return NaN;
};

solution.inputs = [getInput];

export default solution;
