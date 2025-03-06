export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function wrapAround(value: number, min: number, max: number) {
  if (value > max) {
    return min;
  }

  if (value < min) {
    return max;
  }

  return value;
}
