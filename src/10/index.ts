import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const getInput = readFileSeparated("\n", "10", "input").then(values =>
  values.map(v => v.split("").map(v => v === "#"))
);

interface Coord {
  x: number;
  y: number;
}
const getMagnitude = (c: Coord) => {
  return Math.sqrt(Math.pow(c.x, 2) + Math.pow(c.y, 2));
};
const round = (value: number) => Math.floor(value * 100) / 100;

const getNormal = (vector: Coord, magnitude: number): Coord => {
  return { x: round(vector.x / magnitude), y: round(vector.y / magnitude) };
};
const getUnitVector = (v: Coord): Coord => {
  for (let divisor = 30; divisor > 0; divisor--) {
    if (v.x % divisor === 0 && v.y % divisor === 0) {
      return { x: v.x / divisor, y: v.y / divisor };
    }
  }
  return v;
};

const getAsteroidData = (from: Coord, to: Coord) => {
  const between = { x: to.x - from.x, y: to.y - from.y };
  const magnitude = getMagnitude(between);
  const normal = getUnitVector(between);
  return { distance: magnitude, normal };
};
const coordEquals = (a: Coord, b: Coord) => {
  return a.x === b.x && a.y === b.y;
};
const getAsteroidsInLineOfSight = (
  asteroids: boolean[][],
  x: number,
  y: number
) => {
  const otherAsteroids = asteroids
    .flatMap((line, y) => line.map((a, x) => ({ hasAsteroid: a, x, y })))
    .filter(a => a.hasAsteroid && (a.x !== x || a.y !== y))
    .map(a => ({ x: a.x, y: a.y, data: getAsteroidData({ x, y }, a) }));
  return otherAsteroids.filter((a, i) => {
    const sameNormalAsteroids = otherAsteroids.filter(
      (oa, j) => i !== j && coordEquals(a.data.normal, oa.data.normal)
    );
    const isClosestAsteroid =
      sameNormalAsteroids.filter((oa, j) => oa.data.distance < a.data.distance)
        .length === 0;
    return sameNormalAsteroids.length === 0 || isClosestAsteroid;
  });
};

const getBestPosition = (asteroids: boolean[][]) => {
  const height = asteroids.length;
  const width = asteroids[0].length;

  const hasAsteroid = (x: number, y: number) => asteroids[y][x];
  let maxLineOfSight = 0;
  let bestCoord: Coord | undefined;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (hasAsteroid(x, y)) {
        const asteroidsInLineOfSight = getAsteroidsInLineOfSight(
          asteroids,
          x,
          y
        );
        if (asteroidsInLineOfSight.length > maxLineOfSight) {
          maxLineOfSight = asteroidsInLineOfSight.length;
          bestCoord = { x, y };
        }
      }
    }
  }

  return { best: bestCoord, count: maxLineOfSight };
};

const coordToString = (c: Coord | undefined) =>
  c ? `<${c.x}, ${c.y}>` : "<undefined>";

const test = (lines: string[], expectedBest: Coord, expectedCount: number) => {
  const asteroids = lines.map(l => l.split("").map(lv => lv === "#"));
  const { best, count } = getBestPosition(asteroids);
  if (!best || !coordEquals(best, expectedBest)) {
    throw Error(
      `Test failed: best position of ${coordToString(
        best
      )} does match expected ${coordToString(expectedBest)}`
    );
  }
  if (count !== expectedCount) {
    throw Error(
      `Test failed: best count of ${count} does match expected ${expectedCount}`
    );
  }
  console.log("Test passed");
};

const solution: Solution = async () => {
  const asteroids = (await getInput).slice();

  test([".#..#", ".....", "#####", "....#", "...##"], { x: 3, y: 4 }, 8);

  test(
    [
      "......#.#.",
      "#..#.#....",
      "..#######.",
      ".#.#.###..",
      ".#..#.....",
      "..#....#.#",
      "#..#....#.",
      ".##.#..###",
      "##...#..#.",
      ".#....####"
    ],
    { x: 5, y: 8 },
    33
  );

  const bestCoord = getBestPosition(asteroids);
  console.log(bestCoord);

  return bestCoord.count;
};

const getAngle = (from: Coord, to: Coord) => {
  let a = (Math.atan2(to.y - from.y, to.x - from.x) / Math.PI) * 180 + 90;
  if (a < 0) {
    a += 360;
  }
  return a;
};

const byAngleFrom = (from: Coord) => (a: Coord, b: Coord) => {
  return getAngle(from, a) - getAngle(from, b);
};

const vaporiseAsteroids = (asteroids: boolean[][], useBest?: Coord) => {
  const { best } = useBest ? { best: useBest } : getBestPosition(asteroids);
  if (!best) {
    throw Error("Could not detemine best position");
  }
  console.log("Using best:", best);

  let result: Coord | undefined;

  let vaporised = 0;
  for (let i = 0; i < 3; i++) {
    const asteroidsToVaporise = getAsteroidsInLineOfSight(
      asteroids,
      best.x,
      best.y
    ).sort(byAngleFrom(best));
    while (asteroidsToVaporise.length > 0) {
      const asteroid = asteroidsToVaporise.shift()!;
      vaporised++;
      asteroids[asteroid.y][asteroid.x] = false;
      // For manual checking
      // if ([1, 2, 3, 10, 20].includes(vaporised)) {
      //   console.log(vaporised, asteroid.x, asteroid.y);
      // }
      if (vaporised === 200) {
        console.log(asteroid);
        return asteroid;
      }
    }
  }
};

solution.partTwo = async () => {
  let asteroids = (await getInput).slice();

  // Some manual validation of angles for two points, to check they're ordering the right way

  // As per example, first should be lower than second
  console.log(getAngle({ x: 11, y: 13 }, { x: 11, y: 12 }));
  console.log(getAngle({ x: 11, y: 13 }, { x: 1, y: 12 }));

  // Expect these to ascend as they go clockwise
  console.log(getAngle({ x: 1, y: 1 }, { x: 1, y: 0 }));
  console.log(getAngle({ x: 1, y: 1 }, { x: 2, y: 1 }));
  console.log(getAngle({ x: 1, y: 1 }, { x: 1, y: 2 }));
  console.log(getAngle({ x: 1, y: 1 }, { x: 0, y: 1 }));

  vaporiseAsteroids(
    [
      ".#..##.###...#######",
      "##.############..##.",
      ".#.######.########.#",
      ".###.#######.####.#.",
      "#####.##.#.##.###.##",
      "..#####..#.#########",
      "####################",
      "#.####....###.#.#.##",
      "##.#################",
      "#####.##.###..####..",
      "..######..##.#######",
      "####.##.####...##..#",
      ".#####..#.######.###",
      "##...#.##########...",
      "#.##########.#######",
      ".####.#.###.###.#.##",
      "....##.##.###..#####",
      ".#.#.###########.###",
      "#.#.#.#####.####.###",
      "###.##.####.##.#..##"
    ].map(line => line.split("").map(v => v === "#"))
  );

  const asteroid200 = vaporiseAsteroids(asteroids);

  return asteroid200 ? asteroid200.x * 100 + asteroid200.y : NaN;
};

solution.inputs = [getInput];

export default solution;
