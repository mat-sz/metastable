import type { GlueTexture } from 'fxglue/lib/GlueTexture';

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
  // TODO: options
  // TODO: draw cursor - cursor as shader
  // TODO: on left click

  readonly id: string;
  readonly name: string;
  readonly options: ToolOption[];

  settings: any;

  // TODO: pass editor state
  // TODO: return new editor state
  // TODO: pass mouse state

  down(point: Point): void;
  move(point: Point): void;
  up(point: Point): void;

  reset(): void;
}

export interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  texture: GlueTexture;
  offset: Point;
}

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
