// TODO: layer effects
// TODO: undo/redo somehow
// TODO: load image layer
// TODO: fill tool

import { GlueCanvas } from 'fxglue';
import { nanoid } from 'nanoid';
import { MoveTool } from './tools/move';
import { BrushTool } from './tools/brush';
import { EditorState, Layer, Point, Tool } from './types';
import { EraserTool } from './tools/eraser';
import { SelectTool } from './tools/select';

export class BasicEventEmitter<
  TEvents extends { [key: string]: (...args: any[]) => void },
> {
  private _handlers: { [key in keyof TEvents]?: Set<TEvents[key]> } = {};

  on<TKey extends keyof TEvents>(eventName: TKey, listener: TEvents[TKey]) {
    if (!this._handlers[eventName]) {
      this._handlers[eventName] = new Set();
    }

    this._handlers[eventName]?.add(listener);
  }

  off<TKey extends keyof TEvents>(eventName: TKey, listener: TEvents[TKey]) {
    this._handlers[eventName]?.delete(listener);
  }

  emit<TKey extends keyof TEvents>(
    eventName: TKey,
    ...args: Parameters<TEvents[TKey]>
  ) {
    const callbacks = [...(this._handlers[eventName]?.values() || [])];
    for (const callback of callbacks) {
      callback.apply(this, args);
    }
  }
}

const selectionEdgeFragment = `
@use wrap

uniform sampler2D iImage;
uniform vec2 iSize;

float clipped(vec2 uv) {
  float val = texture2D(iImage, uv).a;
  return clip(uv) * val;
}

void main() {
  vec2 p = gl_FragCoord.xy / iResolution;
  vec2 uv = gl_FragCoord.xy / iResolution;

  uv.y += iSize.y / iResolution.y - 1.0;
  uv *= iResolution / iSize;

  vec4 src = texture2D(iTexture, p);

  vec4 dest = texture2D(iImage, uv);
  dest *= clip(uv);

  float h = 1.0/iResolution.x;
  float v = 1.0/iResolution.y;

  float o = dest.a;
  float n = clipped(uv + vec2(0.0, -v));
  float e = clipped(uv + vec2(h, 0.0));
  float s = clipped(uv + vec2(0.0, v));
  float w = clipped(uv + vec2(-h, 0.0));

  if (n > o || s > o) {
    if (fract(p.x * iResolution.x / 8.0) > 0.5) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  } else if (e > o || w > o) {
    if (fract(p.y * iResolution.y / 8.0) > 0.5) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  } else {
    gl_FragColor = src;
  }
}
`;

export class Editor extends BasicEventEmitter<{
  toolChanged: () => void;
  toolSettingsChanged: () => void;
  state: () => void;
  foregroundColorChanged: () => void;
  backgroundColorChanged: () => void;
}> {
  state: EditorState = {
    layers: [],
    selection: document.createElement('canvas'),
  };

  glueCanvas = new GlueCanvas();
  glue = this.glueCanvas.glue;

  tools: Record<string, Tool> = {
    move: new MoveTool(),
    brush: new BrushTool(this),
    eraser: new EraserTool(this),
    select: new SelectTool(this),
  };
  currentToolId = 'move';

  private _foregroundColor = '#000000';
  private _backgroundColor = '#ffffff';

  get foregroundColor() {
    return this._foregroundColor;
  }

  set foregroundColor(value: string) {
    this._foregroundColor = value;
    this.emit('foregroundColorChanged');
  }

  get backgroundColor() {
    return this._backgroundColor;
  }

  set backgroundColor(value: string) {
    this._backgroundColor = value;
    this.emit('backgroundColorChanged');
  }

  constructor() {
    super();
    this.render();

    const canvas = this.glueCanvas.canvas;
    canvas.addEventListener('pointerdown', e => {
      // TODO: Handle offsets and zoom
      this.currentTool.down(this.pointerEventToPoint(e));
    });
    canvas.addEventListener('pointermove', e => {
      // TODO: Handle offsets and zoom
      this.currentTool.move(this.pointerEventToPoint(e));
    });
    canvas.addEventListener('pointerup', e => {
      // TODO: Handle offsets and zoom
      this.currentTool.up(this.pointerEventToPoint(e));
    });

    this.glue.registerTexture('~selection', this.state.selection);
    this.glue.registerProgram('~selectionEdge', selectionEdgeFragment);
  }

  private pointerEventToPoint(e: PointerEvent): Point {
    const rect = this.glueCanvas.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  get currentLayer() {
    return this.state.layers.find(
      layer => layer.id === this.state.currentLayerId,
    );
  }

  get currentTool() {
    return this.tools[this.currentToolId];
  }

  selectTool(id: string) {
    this.currentToolId = id;
    const tool = this.currentTool;
    tool.reset();
    this.emit('toolChanged');
  }

  private newLayer(width = 500, height = 500) {
    const id = nanoid();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const texture = this.glue.registerTexture(id, canvas);
    const layerNumbers = this.state.layers
      .filter(layer => layer.name.startsWith('Layer '))
      .map(layer => parseInt(layer.name.replace('Layer ', '')));
    const max = Math.max(...layerNumbers, 0);
    const layer: Layer = {
      id,
      name: `Layer ${max + 1}`,
      texture,
      canvas,
    };
    this.state.layers.unshift(layer);
    return layer;
  }

  emptyLayer() {
    const layer = this.newLayer();
    this.state.currentLayerId = layer.id;
    this.emit('state');
  }

  imageLayer(image: HTMLImageElement) {
    const layer = this.newLayer(image.naturalWidth, image.naturalHeight);
    const ctx = layer.canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    this.state.currentLayerId = layer.id;
    this.emit('state');
  }

  selectLayer(id: string) {
    this.state.currentLayerId = id;
    this.emit('state');
  }

  deleteLayer(id: string) {
    const layer = this.state.layers.find(layer => layer.id === id);
    if (!layer) {
      return;
    }

    this.glue.deregisterTexture(layer.id);
    this.state.layers = this.state.layers.filter(layer => layer.id !== id);
    this.emit('state');
  }

  render() {
    const glue = this.glue;
    this.glueCanvas.setSize(
      this.glueCanvas.canvas.clientWidth,
      this.glueCanvas.canvas.clientHeight,
    );

    const layers = [...this.state.layers].reverse();
    for (const layer of layers) {
      glue.texture(layer.id)?.update();
      glue.texture(layer.id)?.draw();
    }

    glue.texture('~selection')?.update(this.state.selection);
    glue.texture('~selection')?.use();
    glue.program('~selectionEdge')?.apply({
      iImage: 1,
      iSize: [this.state.selection.width, this.state.selection.height],
    });

    glue.render();
    setTimeout(() => {
      requestAnimationFrame(() => this.render());
    }, 50);
  }
}
