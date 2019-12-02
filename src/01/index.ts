import { readFileLines, toNumber } from "../helpers";

const fuelForMass = (mass: number) => {
  const f = Math.floor(mass / 3) - 2;
  return Math.max(f, 0);
};

const recursiveFuelForMass = (mass: number) => {
  let totalFuel = fuelForMass(mass);
  let fuelMass = totalFuel;
  while (fuelMass > 0) {
    const nextFuel = fuelForMass(fuelMass);
    totalFuel += nextFuel;
    fuelMass = nextFuel;
  }
  return totalFuel;
};

const getInput = readFileLines("01", "input");

const solution: Solution = async () => {
  const input = await getInput;

  const result = input
    .map(toNumber)
    .reduce((total, mass) => total + fuelForMass(mass), 0);

  return result;
};

solution.partTwo = async () => {
  const input = await getInput;

  const result = input
    .map(toNumber)
    .reduce((total, mass) => total + recursiveFuelForMass(mass), 0);

  return result;
};

export default solution;
