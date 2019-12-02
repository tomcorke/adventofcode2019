type Answer = string | number;
type AsyncAnswer = Promise<Answer>;
type Solution = { (): Answer | AsyncAnswer; partTwo?: Solution };

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
  console.error(`Error loading solution for day ${args[0]}:`, e);
  process.exit(1);
}

(async () => {
  try {
    if (!solution) {
      throw Error("Solution not defined");
    }
    if (typeof solution !== "function") {
      throw Error("Solution is not a function");
    }

    const result = await solution();
    console.log("");
    console.log(`Day ${args[0]} result   : ${result}`);

    if (solution.partTwo) {
      const partTwoResult = await solution.partTwo();
      console.log(`Part two result : ${partTwoResult}`);
    }

    console.log("");
  } catch (e) {
    console.error(`Error running solution for day ${args[0]}:`, e.message);
  }
})();
