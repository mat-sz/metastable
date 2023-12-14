import type { Editor } from '..';
import { linePoints } from '../helpers';
import { Point, Tool, ToolOption } from '../types';

export class BrushTool implements Tool {
  readonly id: string = 'brush';
  readonly name: string = 'Brush';
  readonly options: Record<string, ToolOption> = {};

  private lastPoint: Point | undefined = undefined;
  private isDown = false;

  constructor(private editor: Editor) {}

  prepareBrush(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.editor.foregroundColor;
  }

  renderBrush(ctx: CanvasRenderingContext2D, { x, y }: Point) {
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fill();
  }

  draw(point: Point, line = false) {
    const layer = this.editor.currentLayer;
    if (!layer) {
      return;
    }

    let points: Point[] = [point];
    const last = this.lastPoint;
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

    this.lastPoint = point;
  }

  down(point: Point) {
    this.isDown = true;
    this.draw(point);
  }

  move(point: Point) {
    if (this.isDown) {
      this.draw(point, true);
    }
  }

  up(point: Point) {
    this.isDown = false;
    this.draw(point, true);
    this.lastPoint = undefined;
  }

  reset() {}
}
