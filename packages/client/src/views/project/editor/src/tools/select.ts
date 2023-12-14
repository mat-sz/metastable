import type { Editor } from '..';
import { Point, Tool, ToolOption } from '../types';

export class SelectTool implements Tool {
  readonly id: string = 'select';
  readonly name: string = 'Select';
  readonly options: Record<string, ToolOption> = {};
  private lastPoint: Point | undefined = undefined;

  constructor(private editor: Editor) {}

  down(point: Point) {
    this.lastPoint = point;
  }

  move(point: Point) {
    const last = this.lastPoint;
    if (!last) {
      return;
    }

    const x1 = Math.min(point.x, last.x);
    const x2 = Math.max(point.x, last.x);
    const y1 = Math.min(point.y, last.y);
    const y2 = Math.max(point.y, last.y);
    const inset = 1;

    const { canvas, offset } = this.editor.selection;
    canvas.width = x2 - x1 + inset;
    canvas.height = y2 - y1 + inset;
    offset.x = x1 - inset;
    offset.y = y1 - inset;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(
      inset,
      inset,
      canvas.width - inset * 2,
      canvas.height - inset * 2,
    );
  }

  up() {
    this.lastPoint = undefined;
  }

  reset() {}
}
