import fs from "fs";
import path from "path";

const DEFAULT_MAPPER = (s: string) => s;

export const readFile = async (...pathParts: string[]) => {
  return new Promise<string>((resolve, reject) => {
    const filePath = path.join(__dirname, ...pathParts);
    console.log(`Loading file from path: "${filePath}"`);
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};

export const readFileSeparated = async (
  separator: string,
  ...pathParts: string[]
) => {
  return (await readFile(...pathParts)).split(separator);
};

export const readFileLines = async (...pathParts: string[]) => {
  return readFileSeparated("\n", ...pathParts);
};

export const toNumber = (s: string) => parseFloat(s);
