import { ProjectOrientation } from '@metastable/types';

export const ACCEPT_IMAGES = 'image/png,image/jpeg';

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((onSuccess, onError) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        onSuccess(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      onError(e);
    }
  });
}

export async function fileToBase64(
  url: string,
): Promise<{ data: string; mime: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  return {
    data: dataUrl.split(',')[1],
    mime: blob.type,
  };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const source = new Image();
  source.src = url;

  return new Promise(resolve => {
    const onload = () => {
      resolve(source);
    };

    if (source.complete && source.naturalHeight > 0) {
      onload();
    } else {
      source.onload = onload;
    }
  });
}

export function detectOrientation(
  width: number,
  height: number,
): ProjectOrientation {
  return height === width
    ? 'square'
    : height > width
      ? 'portrait'
      : 'landscape';
}
