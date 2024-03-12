import { SERVER_HOST } from './config';

export function getUrl(path: string, protocol = 'http') {
  return `${protocol}://${SERVER_HOST}${path}`;
}
