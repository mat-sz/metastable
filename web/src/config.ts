export const SERVER_HOST =
  import.meta.env.VITE_APP_SERVER_HOST || 'localhost:8188';

export function getUrl(path: string, protocol = 'http') {
  return `${protocol}://${SERVER_HOST}${path}`;
}