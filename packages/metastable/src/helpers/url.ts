import url from 'url';

const settings = {
  useFileUrl: false,
};

export function setUseFileUrl(value: boolean) {
  settings.useFileUrl = value;
}

export function getStaticUrl(filePath: string) {
  if (settings.useFileUrl) {
    return url.pathToFileURL(filePath).toString();
  }

  return `/static?path=${encodeURIComponent(filePath)}`;
}
