import { mainStore } from '$stores/MainStore';

export function formatTemperature(value: number) {
  if (mainStore.config.data?.ui.units.temperature === 'F') {
    return `${Math.floor(32 + value * 1.8)}°F`;
  }

  return `${Math.floor(value)}°C`;
}
