import { BrushTool } from './brush';

export class EraserTool extends BrushTool {
  readonly id: string = 'eraser';
  readonly name: string = 'Eraser';

  prepareBrush(ctx: CanvasRenderingContext2D) {
    this.drawBrushCanvas('#000000');
    ctx.globalCompositeOperation = 'destination-out';
  }
}
