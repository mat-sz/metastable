declare global {
  interface Window {
    electronConfig?: {
      isMac: boolean;
    };
  }
}

export const SERVER_HOST =
  import.meta.env.VITE_APP_SERVER_HOST || window.location.host;

export const IS_ELECTRON = import.meta.env.VITE_IS_ELECTRON === '1';
export const IS_MAC = !!window.electronConfig?.isMac;
