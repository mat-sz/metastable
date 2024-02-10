import type { Editor } from '..';
import { type PointerData } from '../helpers';
import { Tool, ToolOption } from '../types';

export class EyedropperTool implements Tool {
  readonly id: string = 'eyedropper';
  readonly name: string = 'Eyedropper';
  readonly options: ToolOption[] = [];

  settings = {};

  constructor(private editor: Editor) {}

  up(data: PointerData) {
    if (!data.action) {
      return;
    }

    const canvas = this.editor.renderArea(data.current.x, data.current.y, 1, 1);
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, 1, 1);
    const color = [...imageData.data]
      .slice(0, 3)
      .map(item => item.toString(16).padStart(2, '0'))
      .join('');
    this.editor.foregroundColor = `#${color}`;
  }
}
