import { readFileSeparated, toVector3, Vector3 } from "../helpers";
import { Solution } from "..";

//const getInput = readFileSeparated("\n", "12", "inputExampleOne").then(values =>
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

  applyGravityOfMoons(moons: Moon[]) {
    for (let i = 0; i < moons.length; i++) {
      const moon = moons[i];
      if (moon.position.x > this.position.x) {
        this.addXVelocity(1);
      } else if (moon.position.x < this.position.x) {
        this.addXVelocity(-1);
      }
      if (moon.position.y > this.position.y) {
        this.addYVelocity(1);
      } else if (moon.position.y < this.position.y) {
        this.addYVelocity(-1);
      }
      if (moon.position.z > this.position.z) {
        this.addZVelocity(1);
      } else if (moon.position.z < this.position.z) {
        this.addZVelocity(-1);
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

  step() {
    this.stepCount++;
    for (let i = 0; i < this.moons.length; i++) {
      const otherMoons = this.moons.filter((m, j) => i !== j);
      this.moons[i].applyGravityOfMoons(otherMoons);
    }
    for (let i = 0; i < this.moons.length; i++) {
      this.moons[i].move();
    }
  }

  get totalEnergy() {
    return this.moons.reduce((total, moon) => total + moon.energy, 0);
  }

  get snapshot() {
    return this.moons.map(m => m.toString()).join(",");
  }

  get snapshotX() {
    return this.moons.map(m => m.toStringX()).join(",");
  }

  get snapshotY() {
    return this.moons.map(m => m.toStringY()).join(",");
  }

  get snapshotZ() {
    return this.moons.map(m => m.toStringZ()).join(",");
  }

  report() {
    for (let i = 0; i < this.moons.length; i++) {
      console.log(this.moons[i]);
    }
  }
}

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

  let snapshotsX: string[] = [];
  let snapshotsY: string[] = [];
  let snapshotsZ: string[] = [];

  let periodX: number = 0;
  let periodY: number = 0;
  let periodZ: number = 0;

  let stepPeriod = 1;
  let lastUpdate = 1;

  console.log(system.snapshot);

  while (true) {
    for (let i = 0; i < stepPeriod; i++) {
      await system.step();
      // if (system.stepCount >= lastUpdate * 2) {
      //   console.log(`Simulated steps: ${system.stepCount}`);
      //   lastUpdate = system.stepCount;
      // }
    }
    if (!periodX) {
      const snapshot = system.snapshotX;
      const index = snapshotsX.indexOf(snapshot);
      if (index > -1) {
        console.log("Found X period at", system.stepCount - index);
        periodX = system.stepCount - index;
      }
      snapshotsX.push(snapshot);
    }
    if (!periodY) {
      const snapshot = system.snapshotY;
      const index = snapshotsY.indexOf(snapshot);
      if (index > -1) {
        console.log("Found Y period at", system.stepCount - index);
        periodY = system.stepCount - index;
      }
      snapshotsY.push(snapshot);
    }
    if (!periodZ) {
      const snapshot = system.snapshotZ;
      const index = snapshotsZ.indexOf(snapshot);
      if (index > -1) {
        console.log("Found Z period at", system.stepCount - index);
        periodZ = system.stepCount - index;
      }
      snapshotsZ.push(snapshot);
    }
    if (periodX && periodY && periodZ) {
      console.log(system.snapshot);
      return system.stepCount;
    }
  }
};

solution.inputs = [getInput];

export default solution;
