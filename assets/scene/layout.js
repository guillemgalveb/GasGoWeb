export const fuelOffsetX = -3.4;

export const fuelX = x => x + fuelOffsetX;

export const fuelBays = {
  left: { x: -11.7, z: 1.28 },
  right: { x: -1.3, z: 1.15 },
};

export const fuelStopOffset = 3.3;
export const chargingBay = { x: 13.9, z: 1.38 };
export const fuelCameraOffset = { x: 3.18, y: 4.98, z: 2.65 };

const conventionalSeconds = 20;
export const refuellingDemo = {
  conventionalSeconds,
  gasGoSeconds: Math.round(conventionalSeconds * .7),
};
