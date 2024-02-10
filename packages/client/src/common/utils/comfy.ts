export function randomSeed() {
  const min = 0;
  const max = 1125899906842624;
  const range = max - min;
  return Math.floor(Math.random() * range + min);
}
