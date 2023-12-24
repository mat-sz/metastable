import type { Editor } from '..';
import { type PointerData } from '../helpers';
import { Tool, ToolOption } from '../types';

export class SelectTool implements Tool {
  readonly id: string = 'select';
  readonly name: string = 'Select';
  readonly options: ToolOption[] = [];

  settings = {};

  constructor(private editor: Editor) {}

  down() {}

  move(data: PointerData) {
    if (data.action !== 'primary') {
      return;
    }

    const a = data.current;
    const b = data.start!;

    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
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

  up() {}

  reset() {}
}
