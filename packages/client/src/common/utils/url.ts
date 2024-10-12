import { ProjectFileType } from '@metastable/types';

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

export function isLocalUrl(url?: string) {
  return !!(url?.startsWith('data:') || url?.startsWith('blob:'));
}

interface InternalUrlInfo {
  type: ProjectFileType;
  name: string;
}

export function parseInternalUrl(
  internalUrl: string,
): InternalUrlInfo | undefined {
  const url = new URL(internalUrl);
  if (url.protocol !== 'metastable:') {
    return undefined;
  }

  // This works differently in node.js and in browser.
  // node.js parses hostnames for custom protocols, but browsers don't.
  const split = url.pathname.split('/');
  if (
    split.length < 5 ||
    split[2] !== 'current_project' ||
    !Object.values(ProjectFileType).includes(split[3] as any)
  ) {
    return undefined;
  }

  return {
    type: split[3] as ProjectFileType,
    name: split[4],
  };
}
