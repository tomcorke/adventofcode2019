import { readFileSeparated, toNumber } from "../helpers";
import { Solution } from "..";

const readInput = (name: string) =>
  readFileSeparated("\n", "20", name).then(lines =>
    lines.map(line => line.split(""))
  );
const getInput = readInput("input");
const getInputTest0 = readInput("testInput0");
const getInputTestA = readInput("testInputA");
const getInputTestB = readInput("testInputB");

interface Portal {
  portal: string;
  x: number;
  y: number;
}

const mapWithPortals = (map: string[][]) => {
  const maxX = Math.max(...map.map(line => line.length));
  const rows = map.map(line => line.join(""));
  const cols = Array.from(Array(maxX + 1).keys()).map(i =>
    map.map(row => row[i] || " ").join("")
  );
  const portals: Portal[] = [];

  const portalPattern = /[A-Z]{2}\.|\.[A-Z]{2}/g;
  rows.forEach((r, y) => {
    const matches = r.match(portalPattern);
    matches &&
      matches.forEach(match => {
        const x = r.indexOf(match) + match.indexOf(".");
        portals.push({ portal: match.replace(".", ""), x, y });
      });
  });
  cols.forEach((r, x) => {
    const matches = r.match(portalPattern);
    matches &&
      matches.forEach(match => {
        const y = r.indexOf(match) + match.indexOf(".");
        portals.push({ portal: match.replace(".", ""), x, y });
      });
  });

  const portalMap = map.map((row, y) =>
    row.map((col, x) => {
      const portal = portals.find(p => p.x === x && p.y === y);
      if (portal) {
        return portal.portal;
      }
      return col;
    })
  );

  return [portalMap, portals] as [string[][], Portal[]];
};

interface Path {
  from: string;
  to: string;
  direction: number;
  steps: number;
}

const isFloor = (tile: string) => tile === ".";
const isPortal = (tile: string) => tile.length === 2;
const isPassable = (tile: string | null): tile is string => {
  return tile !== null && (isFloor(tile) || isPortal(tile));
};
const floodPathsFrom = (map: string[][], origin: Portal) => {
  const visited: boolean[][] = [];
  const isVisited = (x: number, y: number) => visited[y] && visited[y][x];
  const setVisited = (x: number, y: number) => {
    if (!visited[y]) {
      visited[y] = [];
    }
    visited[y][x] = true;
  };
  const maxY = map.length;
  const maxX = Math.max(...map.map(row => row.length));
  const getMap = (x: number, y: number) =>
    map[y] !== undefined ? (map[y][x] !== undefined ? map[y][x] : null) : null;
  const paths: Path[] = [];
  let steps = 0;
  setVisited(origin.x, origin.y);
  while (true) {
    let stepped = false;
    let tempVisited: [number, number][] = [];
    steps++;
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        const neighbours = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1]
        ].map(([ox, oy]) => [x + ox, y + oy]);
        const tile = getMap(x, y);
        if (
          isPassable(tile) &&
          !isVisited(x, y) &&
          neighbours.some(([nx, ny]) => isVisited(nx, ny))
        ) {
          stepped = true;
          tempVisited.push([x, y]);
          if (isPortal(tile)) {
            paths.push({
              from: origin.portal,
              to: tile,
              steps: steps,
              direction: 1
            }); // Add 1 for portal ends
          }
        }
      }
    }
    tempVisited.forEach(([x, y]) => setVisited(x, y));
    if (!stepped) {
      break;
    }
  }
  return paths;
};

const routeSteps = (route: Path[]) =>
  route.reduce((steps, path) => steps + path.steps, 0) + route.length - 1;

const routeString = (route: Path[]) =>
  [route[0].from, ...route.map(r => r.to)].join(",") +
  ` (${routeSteps(route)})`;

const run = (map: string[][]) => {
  const [portalMap, portals] = mapWithPortals(map);

  const paths: Path[] = [];

  for (const portal of portals) {
    paths.push(...floodPathsFrom(portalMap, portal));
  }

  console.log(paths);

  let routes: Path[][] = [];
  const START = "AA";
  const END = "ZZ";

  let bestSteps: number | undefined;

  while (true) {
    let addedRoute = false;

    if (routes.length === 0) {
      routes = paths.filter(path => path.from === START).map(p => [p]);
      addedRoute = true;
    } else {
      let newRoutes: Path[][] = [];

      routes.forEach(route => {
        const lastPortal = route[route.length - 1].to;

        if (lastPortal === END) {
          newRoutes.push(route);
        } else {
          const routePaths = paths
            .filter(path => path.from === lastPortal)
            .filter(
              // Eliminate circular paths
              path => !route.some(p => p.from === path.to || p.to === path.to)
            );
          if (routePaths.length === 0) {
            return;
          }

          console.log("Branching from route", routeString(route), routePaths);

          routePaths.forEach(path => {
            const newRoute = [...route, path];
            const newRouteSteps = routeSteps(newRoute);
            if (path.to === END && (!bestSteps || newRouteSteps < bestSteps)) {
              console.log("Set best steps", routeString(newRoute));
              console.log("");
              bestSteps = newRouteSteps;
            } else if (bestSteps && newRouteSteps > bestSteps) {
              // Skip this route, it's already longer than current best
              console.log("Skip new route with steps", routeString(newRoute));
              console.log("");
              return;
            }
            console.log("Add route", routeString(newRoute));
            console.log("");
            newRoutes.push(newRoute);
            addedRoute = true;
          });
        }
      });

      routes = newRoutes;
    }

    if (!addedRoute) {
      break;
    }
  }

  const minSteps = Math.min(...routes.map(r => routeSteps(r)));
  const bestRoute = routes.find(r => routeSteps(r) === minSteps);

  if (!bestRoute) {
    throw Error("Could not get best route");
  }

  console.log("Best route:", routeString(bestRoute), routeSteps(bestRoute));
  return routeSteps(bestRoute);
};

const solution: Solution = async () => {
  const input = await getInput;

  return run(input);
};

const test = async (
  pendingInput: typeof getInput,
  expectedResult: number
): Promise<void> => {
  const input = await pendingInput;
  const actual = run(input);
  if (actual !== expectedResult) {
    throw Error(
      `Test failed, expected result ${expectedResult}, actual result ${actual}`
    );
  }
};

solution.tests = async () => {
  await test(getInputTest0, 7);
  await test(getInputTestA, 23);
  await test(getInputTestB, 58);
};

solution.partTwo = async () => {
  const input = await getInput;

  return NaN;
};

solution.inputs = [getInput];

export default solution;
