import { Tool, ToolOption } from '../types';

export class MoveTool implements Tool {
  readonly id: string = 'move';
  readonly name: string = 'Move';
  readonly options: ToolOption[] = [];

  settings = {};

  down() {}
  move() {}
  up() {}

  reset() {}
}
