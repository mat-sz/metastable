import type { Editor } from '..';
import { type PointerData } from '../helpers';
import { Tool, ToolOption, ToolOptionType } from '../types';


function getPixel(
  dataView: DataView,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return -1;
  } else {
    return dataView.getUint32((y * width + x) * 4, false);
  }
}

function comparePixel(
  dataView: DataView,
  x: number,
  y: number,
  width: number,
  height: number,
  baseColor: number,
  tolerance: number,
) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return false;
  } else {
    const pixel = dataView.getUint32((y * width + x) * 4, false);
    if ((pixel & 0xff) < 2 && (baseColor & 0xff) < 2) {
      return true;
    }

    if (pixel === baseColor) {
      return true;
    }

    const a = pixel & 0xff;
    const b = (pixel >> 8) & 0xff;
    const g = (pixel >> 16) & 0xff;
    const r = (pixel >> 24) & 0xff;
    const ba = baseColor & 0xff;
    const bb = (baseColor >> 8) & 0xff;
    const bg = (baseColor >> 16) & 0xff;
    const br = (baseColor >> 24) & 0xff;

    return (
      Math.abs(ba - a) <= tolerance &&
      Math.abs(bb - b) <= tolerance &&
      Math.abs(bg - g) <= tolerance &&
      Math.abs(br - r) <= tolerance
    );
  }
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: number,
  tolerance: number,
) {
  x = Math.floor(x);
  y = Math.floor(y);

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const dataView = new DataView(imageData.data.buffer);

  const { width, height } = imageData;
  const baseColor = getPixel(dataView, x, y, width, height);

  if (baseColor !== fillColor) {
    const stack = [x, y];

    while (stack.length) {
      let y = stack.pop()!;
      const x = stack.pop()!;
      let contiguousDown = true; // Vertical is assumed to be true
      let contiguousUp = true; // Vertical is assumed to be true
      let contiguousLeft = false;
      let contiguousRight = false;

      // Move to top most contiguousDown pixel
      while (contiguousUp && y > 0) {
        y--;
        contiguousUp = comparePixel(
          dataView,
          x,
          y,
          width,
          height,
          baseColor,
          tolerance,
        );
      }

      // Move downward
      while (contiguousDown && y < height) {
        dataView.setUint32((y * width + x) * 4, fillColor, false);

        // Check left
        if (
          x - 1 >= 0 &&
          comparePixel(dataView, x - 1, y, width, height, baseColor, tolerance)
        ) {
          if (!contiguousLeft) {
            contiguousLeft = true;
            stack.push(x - 1, y);
          }
        } else {
          contiguousLeft = false;
        }

        // Check right
        if (
          x + 1 < width &&
          comparePixel(dataView, x + 1, y, width, height, baseColor, tolerance)
        ) {
          if (!contiguousRight) {
            stack.push(x + 1, y);
            contiguousRight = true;
          }
        } else {
          contiguousRight = false;
        }

        y++;
        contiguousDown = comparePixel(
          dataView,
          x,
          y,
          width,
          height,
          baseColor,
          tolerance,
        );
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
}

function stringToColor(str: string) {
  return parseInt(`${str.substring(1)}ff`, 16);
}

export class FillTool implements Tool {
  readonly id: string = 'fill';
  readonly name: string = 'Fill';
  readonly options: ToolOption[] = [
    {
      id: 'tolerance',
      name: 'Tolerance',
      type: ToolOptionType.SLIDER,
      defaultValue: 40,
      min: 0,
      max: 255,
      step: 1,
    },
  ];

  settings = {
    tolerance: 40,
  };

  constructor(private editor: Editor) {}

  up(data: PointerData) {
    if (!data.action) {
      return;
    }

    const layer = this.editor.currentLayer;
    if (layer) {
      const point = data.relative('current')!;
      const ctx = layer.canvas.getContext('2d')!;
      floodFill(
        ctx,
        point.x,
        point.y,
        stringToColor(this.editor.foregroundColor),
        this.settings.tolerance,
      );
    }
  }
}
