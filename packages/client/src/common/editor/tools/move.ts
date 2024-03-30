import type { Editor } from '..';
import { type PointerData } from '../helpers';
import { Vector2 } from '../primitives/Vector2';
import { Tool, ToolOption } from '../types';


export class MoveTool implements Tool {
  readonly id: string = 'move';
  readonly name: string = 'Move';
  readonly options: ToolOption[] = [];

  private startOffset: Vector2 | undefined = undefined;

  settings = {};

  constructor(private editor: Editor) {}

  down(data: PointerData) {
    if (!data.action) {
      return;
    }

    if (data.action === 'primary') {
      const layer = this.editor.currentLayer;
      if (layer) {
        this.startOffset = Vector2.fromPoint(layer.offset);
      }
    } else {
      this.startOffset = Vector2.fromPoint(this.editor.offset);
    }
  }

  move(data: PointerData) {
    if (!data.action || !this.startOffset) {
      return;
    }

    const diff = data.diffStart;
    const vector = this.startOffset.clone().add(diff);

    if (data.action === 'primary') {
      const layer = this.editor.currentLayer;
      if (layer) {
        layer.offset = vector.point;
      }
    } else {
      this.editor.offset = vector.point;
    }
  }

  up() {
    this.startOffset = undefined;
  }
}
