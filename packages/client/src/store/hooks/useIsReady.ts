import { useInstanceStore } from '$store/instance';

export function useIsReady() {
  const isInstanceReady = useInstanceStore(state => state.ready);

  return isInstanceReady;
}
