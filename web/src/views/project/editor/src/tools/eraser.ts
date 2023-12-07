import { BrushTool } from './brush';

export class EraserTool extends BrushTool {
  readonly id: string = 'eraser';
  readonly name: string = 'Eraser';

  prepareBrush(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#000000';
    ctx.globalCompositeOperation = 'destination-out';
  }
}
