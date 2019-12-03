import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import _ from "lodash";

const getInput = readFileSeparated("\n", "03", "input").then(results =>
  results.map(line => line.split(","))
);

interface Coord {
  x: number;
  y: number;
  steps: number;
}
interface Line {
  points: Coord[];
}

const createLine = (origin: Coord, instruction: string) => {
  const direction = instruction.slice(0, 1);
  const size = parseInt(instruction.slice(1));
  const sizeArray = Array(size).fill(0);
  switch (direction) {
    case "U":
      return sizeArray.map((_, i) => ({
        ...origin,
        y: origin.y + (i + 1),
        steps: origin.steps + i + 1
      }));
    case "D":
      return sizeArray.map((_, i) => ({
        ...origin,
        y: origin.y - (i + 1),
        steps: origin.steps + i + 1
      }));
    case "L":
      return sizeArray.map((_, i) => ({
        ...origin,
        x: origin.x - (i + 1),
        steps: origin.steps + i + 1
      }));
    case "R":
      return sizeArray.map((_, i) => ({
        ...origin,
        x: origin.x + (i + 1),
        steps: origin.steps + i + 1
      }));
    default:
      throw Error(`Unknown direction ${direction}`);
  }
};

const getOrigin = (): Coord => ({ x: 0, y: 0, steps: 0 });

const distance = (point: Coord) => {
  return Math.abs(point.x) + Math.abs(point.y);
};

const instructionsToPoints = (wireInstructions: string[]) => {
  let points: Coord[] = [];
  let position = getOrigin();
  wireInstructions.forEach(instruction => {
    const newLinePoints = createLine(position, instruction);
    position = newLinePoints[newLinePoints.length - 1];
    points = points.concat(newLinePoints);
  });
  console.log(`${points.length} points in wire`);
  return points;
};

const getClosestWireIntersection = (inputs: string[][]) => {
  const wires = inputs.map(instructionsToPoints);

  let intersections: Coord[] = [];

  let minIntersectionDistance: number | undefined;
  wires[0].forEach(point => {
    if (
      wires[1].some(
        otherPoint => point.x === otherPoint.x && point.y === otherPoint.y
      )
    ) {
      intersections.push(point);
      if (
        !minIntersectionDistance ||
        distance(point) < minIntersectionDistance
      ) {
        minIntersectionDistance = distance(point);
      }

      wires[1] = wires[1].filter(
        otherPoint =>
          !minIntersectionDistance ||
          distance(otherPoint) < minIntersectionDistance
      );
    }
  });

  console.log(`${intersections.length} intersection points`);
  const distances = intersections.map(point => distance(point));
  const minDistance = Math.min(...distances);

  return minDistance;
};
const getClosestWireIntersectionBySteps = (inputs: string[][]) => {
  const wires = inputs.map(instructionsToPoints);

  let intersections: [Coord, Coord][] = [];

  let minSteps: number = Infinity;
  wires[0].forEach(point => {
    const intersectingPoint = wires[1].find(
      otherPoint => point.x === otherPoint.x && point.y === otherPoint.y
    );
    if (intersectingPoint) {
      intersections.push([point, intersectingPoint]);
      if (point.steps + intersectingPoint.steps < minSteps) {
        minSteps = point.steps + intersectingPoint.steps;
      }

      wires[1] = wires[1].filter(
        otherPoint => point.steps + otherPoint.steps < minSteps
      );
    }
  });

  console.log(intersections);

  console.log(`${intersections.length} intersection points`);
  return minSteps;
};

const test = (
  rawInputA: string,
  rawInputB: string,
  expectedDistance: number
) => {
  const inputs = [rawInputA.split(","), rawInputB.split(",")];
  const distance = getClosestWireIntersection(inputs);
  if (distance !== expectedDistance) {
    console.error(`Test failed:`);
    console.error(rawInputA);
    console.error(rawInputB);
    console.error(`Result: ${distance}`);
    console.error(`Expected: ${expectedDistance}`);
    throw Error("Test failed");
  }
  console.log("Test passed");
};

const solution: Solution = async () => {
  const inputs = await getInput;

  test(
    "R75,D30,R83,U83,L12,D49,R71,U7,L72",
    "U62,R66,U55,R34,D71,R55,D58,R83",
    159
  );
  test(
    "R98,U47,R26,D63,R33,U87,L62,D20,R33,U53,R51",
    "U98,R91,D20,R16,D67,R40,U7,R15,U6,R7",
    135
  );

  const distance = getClosestWireIntersection(inputs);

  return distance;
};

solution.partTwo = async () => {
  const inputs = await getInput;
  const steps = getClosestWireIntersectionBySteps(inputs);
  return steps;
};

export default solution;
