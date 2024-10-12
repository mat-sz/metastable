import { ProjectFileType, ProjectOrientation } from '@metastable/types';
import { glueIsSourceLoaded } from 'fxglue';

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

export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return await blobToDataUrl(blob);
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

    if (glueIsSourceLoaded(source)) {
      onload();
    } else {
      source.onload = onload;
    }
  });
}

export async function base64ify(image: string) {
  if (image.startsWith('data:')) {
    return image;
  }

  return await imageUrlToBase64(image);
}

export const imageModeOptions = [
  { key: 'stretch', label: 'Stretch' },
  { key: 'center', label: 'Center' },
  { key: 'cover', label: 'Cover' },
  { key: 'contain', label: 'Contain' },
];

export const TYPE_MAP: Record<ProjectFileType, string> = {
  [ProjectFileType.INPUT]: 'Inputs',
  [ProjectFileType.OUTPUT]: 'Outputs',
  [ProjectFileType.MASK]: 'Masks',
};

export async function prepareImage(
  input: string,
  width: number,
  height: number,
  mode?: 'cover' | 'contain' | 'center' | 'stretch' | string,
  mask?: string,
) {
  const source = await loadImage(input);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (mode === 'cover' || mode === 'contain') {
    let scale = 1;
    let imageHeight = 0;
    let imageWidth = 0;
    let x = 0;
    let y = 0;

    let cond = source.naturalWidth > source.naturalHeight;
    if (mode === 'contain') {
      cond = !cond;
    }

    if (cond) {
      scale = height / source.naturalHeight;
      imageWidth = source.naturalWidth * scale;
      imageHeight = height;
      x = (-1 * (imageWidth - height)) / 2;
    } else {
      scale = width / source.naturalWidth;
      imageWidth = width;
      imageHeight = source.naturalHeight * scale;
      y = (-1 * (imageHeight - width)) / 2;
    }
    ctx.drawImage(source, x, y, imageWidth, imageHeight);
  } else if (mode === 'center') {
    const x = width / 2 - source.naturalWidth / 2;
    const y = height / 2 - source.naturalHeight / 2;
    ctx.drawImage(source, x, y, source.naturalWidth, source.naturalHeight);
  } else {
    ctx.drawImage(
      source,
      0,
      0,
      source.naturalWidth,
      source.naturalHeight,
      0,
      0,
      width,
      height,
    );
  }

  if (mask) {
    const image = await loadImage(mask);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      width,
      height,
    );
    ctx.globalCompositeOperation = 'source-over';
  }

  return canvas.toDataURL('image/png');
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
