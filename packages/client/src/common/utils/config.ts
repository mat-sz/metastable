export const SERVER_HOST =
  import.meta.env.VITE_APP_SERVER_HOST || window.location.host;

export const IS_ELECTRON = import.meta.env.MODE.includes('electron');
export const IS_MAC = !!window.electronAPI?.isMac;
