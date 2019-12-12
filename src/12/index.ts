import { readFileSeparated, toVector3, Vector3 } from "../helpers";
import { Solution } from "..";

// const getInput = readFileSeparated("\n", "12", "testInput").then(values =>
const getInput = readFileSeparated("\n", "12", "input").then(values =>
  values.map(toVector3)
);

class Moon {
  public position: Vector3;
  public velocity: Vector3;

  constructor(position: Vector3, velocity: Vector3) {
    this.position = position;
    this.velocity = velocity;
  }

  addPosition(velocity: Vector3) {
    this.position = {
      x: this.position.x + velocity.x,
      y: this.position.y + velocity.y,
      z: this.position.z + velocity.z
    };
  }

  addVelocity(accel: Vector3) {
    this.velocity = {
      x: this.velocity.x + accel.x,
      y: this.velocity.y + accel.y,
      z: this.velocity.z + accel.z
    };
  }

  addXVelocity(accel: number) {
    this.addVelocity({ x: accel, y: 0, z: 0 });
  }

  addYVelocity(accel: number) {
    this.addVelocity({ x: 0, y: accel, z: 0 });
  }

  addZVelocity(accel: number) {
    this.addVelocity({ x: 0, y: 0, z: accel });
  }

  applyGravityOfMoons(
    moons: Moon[],
    runX: boolean = true,
    runY: boolean = true,
    runZ: boolean = true
  ) {
    for (let i = 0; i < moons.length; i++) {
      const moon = moons[i];
      if (runX) {
        if (moon.position.x > this.position.x) {
          this.addXVelocity(1);
        } else if (moon.position.x < this.position.x) {
          this.addXVelocity(-1);
        }
      }
      if (runY) {
        if (moon.position.y > this.position.y) {
          this.addYVelocity(1);
        } else if (moon.position.y < this.position.y) {
          this.addYVelocity(-1);
        }
      }
      if (runZ) {
        if (moon.position.z > this.position.z) {
          this.addZVelocity(1);
        } else if (moon.position.z < this.position.z) {
          this.addZVelocity(-1);
        }
      }
    }
  }

  move() {
    this.addPosition(this.velocity);
  }

  get energy() {
    const potentialEnergy =
      Math.abs(this.position.x) +
      Math.abs(this.position.y) +
      Math.abs(this.position.z);
    const kineticEnergy =
      Math.abs(this.velocity.x) +
      Math.abs(this.velocity.y) +
      Math.abs(this.velocity.z);
    return potentialEnergy * kineticEnergy;
  }

  toString() {
    return `[<${this.position.x},${this.position.y},${this.position.z}>,<${this.velocity.x},${this.velocity.y},${this.velocity.z}>]`;
  }

  toStringX() {
    return `[x:${this.position.x},${this.velocity.x}]`;
  }

  toStringY() {
    return `[y:${this.position.y},${this.velocity.y}]`;
  }

  toStringZ() {
    return `[z:${this.position.z},${this.velocity.z}]`;
  }
}

class System {
  public moons: Moon[] = [];
  public stepCount: number = 0;

  addMoon(moon: Moon) {
    this.moons.push(moon);
  }

  step(runX: boolean = true, runY: boolean = true, runZ: boolean = true) {
    this.stepCount++;
    for (let i = 0; i < this.moons.length; i++) {
      const otherMoons = this.moons.filter((m, j) => i !== j);
      this.moons[i].applyGravityOfMoons(otherMoons, runX, runY, runZ);
    }
    for (let i = 0; i < this.moons.length; i++) {
      this.moons[i].move();
    }
  }

  get totalEnergy() {
    return this.moons.reduce((total, moon) => total + moon.energy, 0);
  }

  get snapshotString() {
    return this.moons.map(m => m.toString()).join(",");
  }

  get snapshotX() {
    return this.moons.flatMap(moon => [moon.position.x, moon.velocity.x]);
  }

  get snapshotY() {
    return this.moons.flatMap(moon => [moon.position.y, moon.velocity.y]);
  }

  get snapshotZ() {
    return this.moons.flatMap(moon => [moon.position.z, moon.velocity.z]);
  }

  report() {
    for (let i = 0; i < this.moons.length; i++) {
      console.log(this.moons[i]);
    }
  }
}

const arrayEquals = <T extends any>(a: T[], b: T[]) => {
  // Assume same length
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

const solution: Solution = async () => {
  const input = (await getInput).slice();

  const system = new System();

  while (input.length > 0) {
    const position = input.shift();
    const velocity = { x: 0, y: 0, z: 0 };
    if (!position || !velocity) {
      console.error("Body requires both position and velocity");
      break;
    }
    const moon = new Moon(position, velocity);
    system.addMoon(moon);
  }

  for (let i = 0; i < 1000; i++) {
    await system.step();
    // console.log(`Step ${i + 1}`);
    // system.report();
  }

  return system.totalEnergy;
};

const primes: number[] = [2];
const getNextPrimeAfter = (fromN: number) => {
  let p = fromN;
  while (true) {
    p++;
    if (!primes.some(prime => p % prime === 0)) {
      primes.push(p);
      return p;
    }
  }
};

const getPrimeFactors = (n: number) => {
  if (n === 1) {
    throw Error("What are you doing");
  }
  if (Math.floor(n) !== n) {
    throw Error("Cannot work with non-integer values, fool");
  }
  if (primes.includes(n)) {
    return [n];
  }

  let r = n;
  let factors: number[] = [];
  while (r > 1) {
    let foundFactor = false;
    let i = 0;
    while (i < primes.length) {
      if (r >= primes[i] && r % primes[i] === 0) {
        factors.push(primes[i]);
        r = r / primes[i];
        if (Math.floor(r) !== r) {
          throw Error("Non-integer result while finding prime factors");
        }
        foundFactor = true;
        break;
      }
      i++;
      if (i === primes.length && !foundFactor) {
        getNextPrimeAfter(primes[primes.length - 1]);
        if (primes[primes.length - 1] > r) {
          throw Error(
            `We shouldn't have got here, found prime greater than remainder: ${
              primes[primes.length - 1]
            }`
          );
        }
      }
    }
  }
  return factors;
};

solution.partTwo = async () => {
  const input = (await getInput).slice();

  const system = new System();

  const moons: Moon[] = [];
  while (input.length > 0) {
    const position = input.shift();
    const velocity = { x: 0, y: 0, z: 0 };
    if (!position || !velocity) {
      console.error("Body requires both position and velocity");
      break;
    }
    const moon = new Moon(position, velocity);
    system.addMoon(moon);
  }

  let originalX = system.snapshotX;
  let originalY = system.snapshotY;
  let originalZ = system.snapshotZ;

  let periodX: number = 0;
  let periodY: number = 0;
  let periodZ: number = 0;

  while (true) {
    system.step(!periodX, !periodY, !periodZ);
    if (!periodX && arrayEquals(system.snapshotX, originalX)) {
      periodX = system.stepCount;
      console.log(`Found repeated X at step ${system.stepCount}`);
    }
    if (!periodY && arrayEquals(system.snapshotY, originalY)) {
      periodY = system.stepCount;
      console.log(`Found repeated Y at step ${system.stepCount}`);
    }
    if (!periodZ && arrayEquals(system.snapshotZ, originalZ)) {
      periodZ = system.stepCount;
      console.log(`Found repeated Z at step ${system.stepCount}`);
    }
    if (periodX && periodY && periodZ) {
      break;
    }
  }

  const xFactors = getPrimeFactors(periodX);
  const yFactors = getPrimeFactors(periodY);
  const zFactors = getPrimeFactors(periodZ);

  console.log("Prime factors:");
  console.log({
    [periodX]: xFactors,
    [periodY]: yFactors,
    [periodZ]: zFactors
  });

  const uniqueDigits = Array.from(
    new Set([...xFactors, ...yFactors, ...zFactors])
  );

  const digitCounts = uniqueDigits.reduce(
    (counts, digit) => ({
      ...counts,
      [digit]: Math.max(
        ...[xFactors, yFactors, zFactors].map(
          fa => fa.filter(f => f === digit).length
        )
      )
    }),
    {} as { [key: number]: number }
  );

  const sum = Object.entries(digitCounts).reduce(
    (total, [digit, count]) => total * Math.pow(parseInt(digit), count),
    1
  );

  return sum;
};

solution.inputs = [getInput];

export default solution;
