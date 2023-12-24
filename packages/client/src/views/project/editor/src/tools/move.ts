import type { Editor } from '..';
import { type PointerData } from '../helpers';
import { Point, Tool, ToolOption } from '../types';

export class MoveTool implements Tool {
  readonly id: string = 'move';
  readonly name: string = 'Move';
  readonly options: ToolOption[] = [];

  private startOffset: Point | undefined = undefined;

  settings = {};

  constructor(private editor: Editor) {}

  down(data: PointerData) {
    if (!data.action) {
      return;
    }

    if (data.action === 'primary') {
      const layer = this.editor.currentLayer;
      if (layer) {
        this.startOffset = { ...layer.offset };
      }
    } else {
      this.startOffset = { ...this.editor.offset };
    }
  }

  move(data: PointerData) {
    if (!data.action || !this.startOffset) {
      return;
    }

    const diff = data.diffStart;

    if (data.action === 'primary') {
      const layer = this.editor.currentLayer;
      if (layer) {
        layer.offset = {
          x: this.startOffset.x + diff.x,
          y: this.startOffset.y + diff.y,
        };
      }
    } else {
      this.editor.offset = {
        x: this.startOffset.x + diff.x,
        y: this.startOffset.y + diff.y,
      };
    }
  }

  up() {
    this.startOffset = undefined;
  }

  reset() {}
}
