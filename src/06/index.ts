import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import _ from "lodash";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getInput = readFileSeparated("\n", "06", "input");

class Body {
  public name: string;
  public parent: Body | null;
  constructor(name: string, parent: Body | null) {
    this.name = name;
    this.parent = parent;
  }

  get depth(): number {
    if (this.parent) {
      return this.parent.depth + 1;
    }
    return 0;
  }

  setParent(parent: Body) {
    this.parent = parent;
  }

  get parents(): Body[] {
    if (!this.parent) {
      return [];
    }
    return [this.parent, ...this.parent.parents];
  }
}

const buildBodyTree = (orbits: string[]) => {
  const bodies: { [key: string]: Body | undefined } = {};

  orbits.forEach((line, index) => {
    const [parent, child] = line.split(")");
    let parentBody = bodies[parent];
    if (!parentBody) {
      parentBody = new Body(parent, null);
      bodies[parent] = parentBody;
    }

    let childBody = bodies[child];
    if (!childBody) {
      childBody = new Body(child, parentBody);
      bodies[child] = childBody;
    } else {
      childBody.setParent(parentBody);
    }
  });

  return bodies;
};

const run = async (orbits: string[]) => {
  const bodies = buildBodyTree(orbits);

  const totalOrbits = Object.values(bodies)
    .filter(body => !!body)
    .reduce((total, body) => total + body!.depth, 0);

  console.log(`Total orbits: ${totalOrbits}`);
  return totalOrbits;
};

const TESTDATA = [
  "COM)B",
  "B)C",
  "C)D",
  "D)E",
  "E)F",
  "B)G",
  "G)H",
  "D)I",
  "E)J",
  "J)K",
  "K)L"
];

const test = async (orbits: string[], expectedOrbitCount: number) => {
  const orbitCount = await run(orbits);
  if (orbitCount !== expectedOrbitCount) {
    throw Error(
      `Test expected orbit count of ${expectedOrbitCount}, received ${orbitCount}`
    );
  }
};

const solution: Solution = async () => {
  const input = await getInput;

  test(TESTDATA, 42);

  return await run(input);
};

const run2 = (orbits: string[], from: string, to: string) => {
  const bodies = buildBodyTree(orbits);

  const fromBody = bodies[from];
  const toBody = bodies[to];

  if (!fromBody || !toBody) {
    throw Error("Could not find from/to body");
  }

  const fromParents = fromBody.parents;
  const toParents = toBody.parents;

  const highestCommonParent = fromParents
    .filter(fromParentBody =>
      toParents.find(toParentBody => toParentBody === fromParentBody)
    )
    .sort((a, b) => b.depth - a.depth)[0];

  if (!highestCommonParent) {
    throw Error("Could not get highest common parent for from/to bodies");
  }

  const transferDistance =
    fromBody.depth + toBody.depth - (highestCommonParent.depth * 2 + 2);

  return transferDistance;
};

const TESTDATA_2 = [
  "COM)B",
  "B)C",
  "C)D",
  "D)E",
  "E)F",
  "B)G",
  "G)H",
  "D)I",
  "E)J",
  "J)K",
  "K)L",
  "K)YOU",
  "I)SAN"
];

const test2 = async (
  orbits: string[],
  from: string,
  to: string,
  expectedTransferCount: number
) => {
  const transferCount = await run2(orbits, from, to);

  if (transferCount !== expectedTransferCount) {
    throw Error(
      `Test expected transfer count of ${expectedTransferCount}, received ${transferCount}`
    );
  }
};

solution.partTwo = async () => {
  const input = await getInput;

  test2(TESTDATA_2, "YOU", "SAN", 4);

  return run2(input, "YOU", "SAN");
};

export default solution;
