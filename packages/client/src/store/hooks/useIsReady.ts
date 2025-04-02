import { useConfigStore } from '$store/config';
import { useInstanceStore } from '$store/instance';

export function useIsReady() {
  const isInstanceReady = useInstanceStore(state => state.ready);
  const isConfigReady = useConfigStore(state => !!state.data);
  return isInstanceReady && isConfigReady;
}
