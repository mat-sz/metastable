import os from 'os';

export function free() {
  const total = os.totalmem();
  const free = os.freemem();

  return {
    total,
    free,
    used: total - free,
  };
}
