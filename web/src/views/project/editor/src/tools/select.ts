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

    const selection = this.editor.state.selection;
    selection.width = Math.max(point.x, last.x) + 5;
    selection.height = Math.max(point.y, last.y) + 5;

    const ctx = selection.getContext('2d')!;
    ctx.clearRect(0, 0, selection.width, selection.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(
      Math.min(point.x, last.x),
      Math.min(point.y, last.y),
      Math.abs(last.x - point.x),
      Math.abs(last.y - point.y),
    );
  }

  up() {
    this.lastPoint = undefined;
  }

  reset() {}
}
