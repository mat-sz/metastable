declare global {
  interface Window {
    electronConfig?: {
      isMac: boolean;
    };
  }
}

function getOS() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const userAgent = window.navigator?.userAgent;
  const platform =
    (window?.navigator as any)?.userAgentData?.platform ||
    window?.navigator?.platform;
  const macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'mac';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'ios';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'windows';
  } else if (/Android/.test(userAgent)) {
    return 'android';
  } else if (/Linux/.test(platform)) {
    return 'linux';
  }

  return undefined;
}

export const SERVER_HOST =
  import.meta.env.VITE_APP_SERVER_HOST || window.location.host;

export const IS_ELECTRON = import.meta.env.VITE_IS_ELECTRON === '1';
export const IS_MAC = window.electronConfig?.isMac ?? getOS() === 'mac';
