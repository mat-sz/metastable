import type { PointerData } from './helpers';
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
  unit?: string;
}

export interface Tool {
  readonly id: string;
  readonly name: string;
  readonly options: ToolOption[];

  settings: any;
  down?(point: PointerData): void;
  move?(point: PointerData): void;
  up?(point: PointerData): void;

  reset?(): void;
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

export interface Size {
  width: number;
  height: number;
}

export interface EditorState {
  layers: Layer[];
  currentLayerId?: string;
}

export interface EditorSelection {
  offset: Point;
  canvas: HTMLCanvasElement;
}

export interface PointerState {
  startPoint: Point;
  lastPoint: Point;
  action?: 'primary' | 'secondary';
}
