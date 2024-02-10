import { glueIsSourceLoaded } from 'fxglue';

export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((onSuccess, onError) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        onSuccess((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      onError(e);
    }
  });
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
  if (image.startsWith('blob:')) {
    return await imageUrlToBase64(image);
  } else if (image.startsWith('data:')) {
    return image.split(',')[1];
  }

  return image;
}

export async function prepareImage(
  input: string,
  width: number,
  height: number,
  mode?: 'cover' | 'contain' | 'center' | 'stretch' | string,
) {
  const source = await loadImage(input);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

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

  return canvas.toDataURL('image/png');
}
