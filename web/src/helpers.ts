export function randomSeed() {
  const min = -1125899906842624;
  const max = 1125899906842624;
  const range = max - min;
  return Math.random() * range + min;
}
