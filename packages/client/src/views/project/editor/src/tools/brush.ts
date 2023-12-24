import type { Editor } from '..';
import { linePoints } from '../helpers';
import {
  Point,
  PointerEventData,
  Tool,
  ToolOption,
  ToolOptionType,
} from '../types';

export class BrushTool implements Tool {
  readonly id: string = 'brush';
  readonly name: string = 'Brush';
  readonly options: ToolOption[] = [
    {
      id: 'hardness',
      name: 'Hardness',
      type: ToolOptionType.SLIDER,
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      id: 'size',
      name: 'Size',
      type: ToolOptionType.SLIDER,
      defaultValue: 50,
      min: 0,
      max: 1000,
      step: 1,
    },
  ];

  private brushCanvas: HTMLCanvasElement = document.createElement('canvas');

  settings = {
    hardness: 1,
    size: 50,
  };

  constructor(private editor: Editor) {}

  drawBrushCanvas(color: string) {
    const radius = this.settings.size / 2;
    const brushCanvas = this.brushCanvas;
    brushCanvas.width = this.settings.size;
    brushCanvas.height = this.settings.size;
    const brushCtx = brushCanvas.getContext('2d')!;
    brushCtx.clearRect(0, 0, brushCanvas.width, brushCanvas.height);
    const gradient = brushCtx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );
    gradient.addColorStop(0, `${color}ff`);
    gradient.addColorStop(this.settings.hardness, `${color}ff`);
    gradient.addColorStop(1.0, `${color}00`);
    brushCtx.fillStyle = gradient;

    brushCtx.beginPath();
    brushCtx.arc(radius, radius, 50, 0, 2 * Math.PI);
    brushCtx.fill();
  }

  prepareBrush(ctx: CanvasRenderingContext2D) {
    ctx.globalCompositeOperation = 'hard-light';
    this.drawBrushCanvas(this.editor.foregroundColor);
  }

  renderBrush(ctx: CanvasRenderingContext2D, { x, y }: Point) {
    const radius = this.settings.size / 2;
    ctx.drawImage(this.brushCanvas, x - radius, y - radius);
  }

  draw(point: Point, last?: Point, line = false) {
    const layer = this.editor.currentLayer;
    if (!layer) {
      return;
    }

    point.x -= layer.offset.x;
    point.y -= layer.offset.y;

    if (last) {
      last.x -= layer.offset.x;
      last.y -= layer.offset.y;
    }

    let points: Point[] = [point];
    if (line && last) {
      const distance = Math.sqrt(
        Math.pow(point.x - last.x, 2) + Math.pow(point.y - last.y, 2),
      );
      if (distance > Math.SQRT2) {
        points = linePoints(last, point);
      }
    }

    const ctx = layer.canvas.getContext('2d')!;
    ctx.save();
    this.prepareBrush(ctx);
    for (const point of points) {
      this.renderBrush(ctx, point);
    }
    ctx.restore();
  }

  down(data: PointerEventData) {
    if (data.action === 'primary') {
      this.draw(data.point, data.lastPoint);
    }
  }

  move(data: PointerEventData) {
    if (data.action === 'primary') {
      this.draw(data.point, data.lastPoint, true);
    }
  }

  up() {}

  reset() {}
}
