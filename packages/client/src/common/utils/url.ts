import { IS_ELECTRON, SERVER_HOST } from './config';

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

export function isLocalUrl(url?: string) {
  return !!(url?.startsWith('data:') || url?.startsWith('blob:'));
}

export function resolveMrn(mrn: string) {
  if (IS_ELECTRON) {
    return `metastable+resolve://${encodeURIComponent(mrn)}`;
  }

  return getUrl(`/resolve?mrn=${encodeURIComponent(mrn)}`);
}

export function resolveImage<T extends string | undefined>(
  url?: T,
  size?: 'thumbnail',
): T {
  if (typeof url === 'undefined') {
    return undefined as T;
  }

  if (isLocalUrl(url)) {
    return url;
  }

  return resolveMrn(`${url}${size ? `?size=${size}` : ''}`) as T;
}
