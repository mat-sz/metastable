import type { GlueTexture } from 'fxglue';

export enum ToolOptionType {
  SLIDER,
}

export interface ToolOption {
  id: string;
  name: string;
  type: ToolOptionType;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface Tool {
  readonly id: string;
  readonly name: string;
  readonly options: ToolOption[];

  settings: any;
  down(point: PointerEventData): void;
  move(point: PointerEventData): void;
  up(point: PointerEventData): void;

  reset(): void;
}

export interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  texture: GlueTexture;
  offset: Point;
}

export interface PointerEventDataWithAction {
  point: Point;
  action: 'primary' | 'secondary';
  startPoint: Point;
  lastPoint: Point;
  diffStart: Point;
}
export interface PointerEventDataWithoutAction {
  point: Point;
  action: undefined;
}

export type PointerEventData =
  | PointerEventDataWithoutAction
  | PointerEventDataWithAction;

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
}

export interface EditorState {
  // TODO: history
  layers: Layer[];
  currentLayerId?: string;
}

export interface EditorSelection {
  offset: Point;
  canvas: HTMLCanvasElement;
}
