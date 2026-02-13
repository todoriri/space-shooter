// Math utility functions for game development

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const inverseLerp = (start: number, end: number, value: number): number => {
  return (value - start) / (end - start);
};

export const remap = (
  value: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number
): number => {
  const t = inverseLerp(inStart, inEnd, value);
  return lerp(outStart, outEnd, t);
};

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomBool = (probability: number = 0.5): boolean => {
  return Math.random() < probability;
};

export const randomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const randomWeighted = <T>(items: Array<{ item: T; weight: number }>): T => {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const { item, weight } of items) {
    if (random < weight) return item;
    random -= weight;
  }

  return items[items.length - 1].item;
};

export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

export const distanceSquared = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export const angleBetween = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

export const pointInCircle = (
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean => {
  return distanceSquared(px, py, cx, cy) <= radius * radius;
};

export const pointInRectangle = (
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean => {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

export const normalize = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

export const smoothStep = (value: number): number => {
  return value * value * (3 - 2 * value);
};

export const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export const wrap = (value: number, min: number, max: number): number => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};