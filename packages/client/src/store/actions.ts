import { useConfigStore } from './config';
import { useUpdateStore } from './update';

export async function refreshAll() {
  await Promise.all([
    useConfigStore.getState().refresh(),
    useUpdateStore.getState().refresh(),
  ]);
}
