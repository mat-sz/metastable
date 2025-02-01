import type { AppUpdater } from 'electron-updater';

let updater: AppUpdater;
export async function loadAppUpdater() {
  const { autoUpdater } = await import('electron-updater');
  updater = autoUpdater;
  if (__ELECTRON_UPDATER_BASE_URL__) {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: __ELECTRON_UPDATER_BASE_URL__,
    });
  }

  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoRunAppAfterInstall = true;
}

export function getUpdater() {
  return updater;
}
