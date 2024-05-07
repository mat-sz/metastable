import os from 'os';

function timesAverage() {
  let totalIdle = 0;
  let totalTick = 0;
  const cpus = os.cpus();

  for (let i = 0, len = cpus.length; i < len; i++) {
    const cpu = cpus[i];
    for (const type of Object.keys(cpu.times)) {
      totalTick += (cpu.times as any)[type];
    }
    totalIdle += cpu.times.idle;
  }

  return {
    totalIdle: totalIdle,
    totalTick: totalTick,
    avgIdle: totalIdle / cpus.length,
    avgTotal: totalTick / cpus.length,
  };
}

export function load(): Promise<number> {
  return new Promise(resolve => {
    const startMeasure = timesAverage();

    setTimeout(() => {
      const endMeasure = timesAverage();
      const idleDifference = endMeasure.avgIdle - startMeasure.avgIdle;
      const totalDifference = endMeasure.avgTotal - startMeasure.avgTotal;
      const cpuPercentage =
        (10000 - Math.round((10000 * idleDifference) / totalDifference)) / 100;

      return resolve(cpuPercentage);
    }, 100);
  });
}
