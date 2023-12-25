import type { Editor } from '..';
import { type PointerData } from '../helpers';
import { Rectangle } from '../primitives/Rectangle';
import { Tool, ToolOption } from '../types';

export class SelectTool implements Tool {
  readonly id: string = 'select';
  readonly name: string = 'Select';
  readonly options: ToolOption[] = [];

  settings = {};

  constructor(private editor: Editor) {}

  move(data: PointerData) {
    if (data.action !== 'primary') {
      return;
    }

    const rect = new Rectangle(data.start, data.current);
    const inset = 1;

    const { canvas, offset } = this.editor.selection;
    canvas.width = rect.width + inset * 2;
    canvas.height = rect.height + inset * 2;
    offset.x = rect.x - inset;
    offset.y = rect.y - inset;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(inset, inset, rect.width, rect.height);
  }
}
