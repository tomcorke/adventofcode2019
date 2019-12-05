import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";
import _ from "lodash";

const getInput = readFileSeparated("-", "04", "input").then(r =>
  r.map(toNumber)
);

const isValid = (passwordString: string, onlyPairs: boolean = false) => {
  const password = passwordString.split("").map(toNumber);

  let i = 0;

  let hasError = false;
  let hasDouble = false;
  let groupLength = 1;

  let last: number | undefined;

  while (i < password.length) {
    const c = password[i];
    if (c === last) {
      groupLength += 1;
    } else {
      if (groupLength === 2 || (!onlyPairs && groupLength > 2)) {
        hasDouble = true;
      }
      groupLength = 1;
    }
    if (last !== undefined && c < last) {
      hasError = true;
      break;
    }
    last = c;
    i += 1;
  }

  if (groupLength === 2 || (!onlyPairs && groupLength > 2)) {
    hasDouble = true;
  }

  return !hasError && hasDouble;
};

const test = (input: string, expected: boolean, onlyPairs: boolean = false) => {
  const inputValid = isValid(input, onlyPairs);
  if (inputValid !== expected) {
    throw Error(
      `Expected ${input} to be ${expected ? "valid" : "invalid"}, but was ${
        inputValid ? "valid" : "invalid"
      }`
    );
  }
};

const solution: Solution = async () => {
  const [from, to] = await getInput;

  test("111111", true);
  test("223450", false);
  test("123789", false);

  const validPasswords: number[] = [];
  for (let p = from; p <= to; p += 1) {
    if (isValid(p.toString())) {
      validPasswords.push(p);
    }
  }

  return validPasswords.length;
};

const isValidR = (password: string, option: boolean) => {
  return /^(9(?![0-8])|8(?![0-7])|7(?![0-6])|6(?![0-5])|5(?![0-4])|4(?![0-3])|3(?![0-2])|2(?![0-1])|1(?!0))*((?<!9)9|(?<!8)8|(?<!7)7|(?<!6)6|(?<!5)5|(?<!4)4|(?<!3)3|(?<!2)2|(?<!1)1)(?=\2(?!\2))+(9(?![0-8])|8(?![0-7])|7(?![0-6])|6(?![0-5])|5(?![0-4])|4(?![0-3])|3(?![0-2])|2(?![0-1])|1(?!0))*$/.test(
    password
  );
};

solution.partTwo = async () => {
  const [from, to] = await getInput;

  test("112233", true, true);
  test("123444", false, true);
  test("111122", true, true);

  // one "line" golf
  // return Array.from(Array(to - from).keys()).filter(p =>
  //   /^(9(?![0-8])|8(?![0-7])|7(?![0-6])|6(?![0-5])|5(?![0-4])|4(?![0-3])|3(?![0-2])|2(?![0-1])|1(?!0))*((?<!9)9|(?<!8)8|(?<!7)7|(?<!6)6|(?<!5)5|(?<!4)4|(?<!3)3|(?<!2)2|(?<!1)1)(?=\2(?!\2))+(9(?![0-8])|8(?![0-7])|7(?![0-6])|6(?![0-5])|5(?![0-4])|4(?![0-3])|3(?![0-2])|2(?![0-1])|1(?!0))*$/.test(
  //     (p + from).toString()
  //   )
  // ).length;

  const validPasswords: number[] = [];
  for (let p = from; p <= to; p += 1) {
    if (isValidR(p.toString(), true)) {
      validPasswords.push(p);
    }
  }

  return validPasswords.length;
};

export default solution;
