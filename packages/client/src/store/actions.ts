import { useConfigStore } from './config';
import { useInstanceStore } from './instance';
import { useUIStore } from './ui';
import { useUpdateStore } from './update';

export async function refreshAll() {
  try {
    await useInstanceStore.getState().refresh();

    await Promise.all([
      useConfigStore.getState().refresh(),
      useUpdateStore.getState().refresh(),
    ]);
  } catch {
    //
  }
}

export function notify(title: string, body: string, onClick?: () => void) {
  const config = useConfigStore.getState().data;

  if (Notification.permission !== 'granted' || !config?.ui?.notifications) {
    return;
  }

  if (useUIStore.getState().isFocused) {
    return;
  }

  const notification = new Notification(title, { body });
  if (onClick) {
    notification.addEventListener('click', onClick);
  }
}
