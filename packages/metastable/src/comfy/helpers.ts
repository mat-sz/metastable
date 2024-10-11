import { ProjectFileType } from '@metastable/types';

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
    split.length < 3 ||
    url.hostname !== 'current_project' ||
    !Object.values(ProjectFileType).includes(split[1] as any)
  ) {
    return undefined;
  }

  return {
    type: split[1] as ProjectFileType,
    name: split[2],
  };
}
