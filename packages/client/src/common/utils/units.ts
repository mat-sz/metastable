import { useConfigStore } from '$store/config';

export function formatTemperature(value: number) {
  const config = useConfigStore.getState().data;
  if (config?.ui.units.temperature === 'F') {
    return `${Math.floor(32 + value * 1.8)}°F`;
  }

  return `${Math.floor(value)}°C`;
}
