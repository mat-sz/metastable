import { useInstanceStore } from '$store/instance';
import { useBackendStore } from '.';

export function useStatus() {
  const connected = useInstanceStore(state => state.connected);
  const status = useBackendStore(state => state.status);

  if (!connected) {
    return 'connecting';
  }

  return status;
}
