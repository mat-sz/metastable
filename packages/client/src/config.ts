export const SERVER_HOST =
  import.meta.env.VITE_APP_SERVER_HOST || window.location.host;

export function getUrl(path: string, protocol = 'http') {
  return `${protocol}://${SERVER_HOST}${path}`;
}

export function getStaticUrl(path: string) {
  if (window.dataDir) {
    return `${window.dataDir}/${path.replace('outputs', 'output')}`;
  }

  return getUrl(path);
}

export const IS_ELECTRON = import.meta.env.MODE.includes('electron');
export const IS_MAC = !!window.electronAPI?.isMac;
