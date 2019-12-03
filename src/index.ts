import { performance } from "perf_hooks";

type Answer = string | number;
type AsyncAnswer = Promise<Answer>;
export type Solution = { (): Answer | AsyncAnswer; partTwo?: Solution };

const args = Array.from(process.argv.slice(2));

const validDayRegex = /^\d{2}$/;

if (!args[0] || !validDayRegex.test(args[0])) {
  throw Error(
    'Day must be specified as two digit number, e.g. "npm start -- 01"'
  );
}

let solution: Solution | undefined;
try {
  solution = require(`./${args[0]}/`).default;
} catch (e) {
  console.error(`Error loading solution for day ${args[0]}:`, e.message);
  process.exit(1);
}

const timeSolution = async (func: Solution) => {
  const start = performance.now();
  const result = await func();
  const end = performance.now();
  return [result, Math.floor((end - start) * 100) / 100];
};

(async () => {
  try {
    if (!solution) {
      throw Error("Solution not defined");
    }
    if (typeof solution !== "function") {
      throw Error("Solution is not a function");
    }

    const [result, partOneTime] = await timeSolution(solution);
    console.log("");
    console.log(`Day ${args[0]} result   : ${result}`);
    console.log(`Completed in ${partOneTime}ms`);

    if (solution.partTwo) {
      const [partTwoResult, partTwoTime] = await timeSolution(solution.partTwo);
      console.log(`Part two result : ${partTwoResult}`);
      console.log(`Completed in ${partTwoTime}ms`);
    }

    console.log("");
  } catch (e) {
    console.error(`Error running solution for day ${args[0]}:`, e.message);
  }
})();
