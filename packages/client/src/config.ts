export const SERVER_HOST =
  import.meta.env.VITE_APP_SERVER_HOST || window.location.host;

export function getUrl(path: string, protocol = 'http') {
  return `${protocol}://${SERVER_HOST}${path}`;
}

export const IS_ELECTRON = import.meta.env.MODE.includes('electron');
