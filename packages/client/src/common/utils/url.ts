import { SERVER_HOST } from './config';

export function getUrl(path: string, protocol = 'http') {
  if (window.location.protocol === 'https:') {
    if (protocol === 'http') {
      protocol = 'https';
    } else if (protocol === 'ws') {
      protocol = 'wss';
    }
  }

  return `${protocol}://${SERVER_HOST}${path}`;
}
