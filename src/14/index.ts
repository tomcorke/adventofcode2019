import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated("\n", "14", "input");
const getInputTestA = readFileSeparated("\n", "14", "testInputA");
const getInputTestB = readFileSeparated("\n", "14", "testInputB");
const getInputTestC = readFileSeparated("\n", "14", "testInputC");
const getInputTestD = readFileSeparated("\n", "14", "testInputD");

interface ChemicalQuantity {
  chemical: string;
  quantity: number;
}

interface Reaction {
  inputs: ChemicalQuantity[];
  output: ChemicalQuantity;
}

const parseChemicalQuantity = (m: string): ChemicalQuantity => {
  const [quantityString, chemical] = m.split(" ");
  return {
    quantity: parseInt(quantityString),
    chemical: chemical.toUpperCase()
  };
};

const parseReaction = (r: string): Reaction => {
  const [inputString, outputString] = r.split("=>");
  return {
    inputs: inputString
      .split(",")
      .map(i => i.trim())
      .map(parseChemicalQuantity),
    output: parseChemicalQuantity(outputString.trim())
  };
};

const parseInput = async (inputPromise: Promise<string[]> | string[]) => {
  const input = await inputPromise;
  return input.map(parseReaction);
};

interface FactoryOptions {
  silent: boolean;
  oreSupply: number;
}
const DEFAULT_FACTORY_OPTIONS: FactoryOptions = {
  silent: false,
  oreSupply: Infinity
};

class OutOfOreError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class Factory {
  private reactions: Reaction[];
  public chemicals: { [chemical: string]: number | undefined } = {};
  public options: FactoryOptions;

  constructor(reactions: Reaction[], options?: Partial<FactoryOptions>) {
    this.reactions = reactions;
    this.options = { ...DEFAULT_FACTORY_OPTIONS, ...options };

    this.chemicals.ORE = this.options.oreSupply;
  }

  // Outputs the amount of ore to produce a quantity of a chemical, assuming all chemicals can be ultimately made from ore
  produce(chemical: string, quantity: number) {
    chemical = chemical.toUpperCase();

    // Check if chemical in stock
    const chemicalsInStock = this.chemicals[chemical] || 0;
    const requiredQuantity = Math.max(0, quantity - chemicalsInStock);

    if (requiredQuantity === 0) {
      !this.options.silent &&
        console.log(
          `Found ${chemicalsInStock} supply of ${chemical}, nothing to produce`
        );
      return 0;
    }

    const producer = this.reactions.find(r => r.output.chemical === chemical);
    if (!producer) {
      throw Error(
        `No reaction defined to produce ${requiredQuantity}x"${chemical}"`
      );
    }

    const numberOfReactions = Math.ceil(
      requiredQuantity / producer.output.quantity
    );
    !this.options.silent &&
      console.log(
        `Producing required inputs for ${numberOfReactions} to output ${requiredQuantity}x${chemical}`
      );

    let requiredOre = 0;
    producer.inputs.forEach(input => {
      !this.options.silent &&
        console.log(
          `Using ${input.quantity * numberOfReactions}x${
            input.chemical
          } to produce ${producer.output.quantity * numberOfReactions}`
        );

      if (input.chemical === "ORE") {
        if (
          !this.chemicals.ORE ||
          this.chemicals.ORE < input.quantity * numberOfReactions
        ) {
          throw new OutOfOreError(
            `Not enough ORE supply to produce ${input.quantity *
              numberOfReactions}x${input.chemical}`
          );
        }
        requiredOre += input.quantity * numberOfReactions;
      }

      requiredOre += this.produce(
        input.chemical,
        input.quantity * numberOfReactions
      );
      if (!this.chemicals[input.chemical]) {
        throw Error(
          `Unexpected zero or undefined stock of chemical ${input.chemical} after production`
        );
      }

      this.chemicals[input.chemical]! -= input.quantity * numberOfReactions;
      if (input.chemical === "ORE" && this.options.oreSupply !== Infinity) {
        !this.options.silent &&
          console.log(`${this.chemicals.ORE} ORE remaining`);
      }
    });

    this.chemicals[chemical] =
      (this.chemicals[chemical] || 0) +
      numberOfReactions * producer.output.quantity;

    return requiredOre;
  }
}

const test = async (
  input: Promise<string[]> | string[],
  expectedOre: number
) => {
  const reactions = await parseInput(input);
  const factory = new Factory(reactions, { silent: true });
  const fuelForOre = factory.produce("fuel", 1);
  if (fuelForOre !== expectedOre) {
    throw Error(`Test failed, expected ${expectedOre}, received ${fuelForOre}`);
  }
  console.log("Test passed");
};

const solution: Solution = async () => {
  const reactions = await parseInput(getInput);

  test(getInputTestA, 165);
  test(getInputTestB, 13312);
  test(getInputTestC, 180697);
  test(getInputTestD, 2210736);

  const factory = new Factory(reactions, { silent: true });

  return factory.produce("fuel", 1);
};

solution.partTwo = async () => {
  const reactions = await parseInput(getInput);

  const ORE_SUPPLY = 1000000000000;

  const factory = new Factory(reactions, {
    silent: true,
    oreSupply: ORE_SUPPLY
  });

  // Test run to get max ore required with no stock
  let firstOreRequired = factory.produce("fuel", 1);
  factory.chemicals.FUEL = 0;
  let fuelProduced = 1;

  let fuelPerTick = 100000;

  while (true) {
    try {
      const estimatedOreRequired =
        firstOreRequired && fuelPerTick * firstOreRequired;
      if (
        fuelPerTick > 1 &&
        estimatedOreRequired &&
        estimatedOreRequired > factory.chemicals.ORE!
      ) {
        !factory.options.silent &&
          console.log(
            `Estimated to run out of ore in current iteration, testing reducing quantity to produce to ${fuelPerTick} per iteration`
          );
        fuelPerTick = Math.floor(fuelPerTick / 2);
        continue;
      }

      factory.produce("fuel", fuelPerTick);

      // Clear out stock after producing a fuel so we can make more
      factory.chemicals.FUEL = 0;
      fuelProduced += fuelPerTick;
    } catch (e) {
      if (e instanceof OutOfOreError) {
        break;
      }
      throw e;
    }
  }

  return fuelProduced;
};

solution.inputs = [
  getInput,
  getInputTestA,
  getInputTestB,
  getInputTestC,
  getInputTestD
];

export default solution;
