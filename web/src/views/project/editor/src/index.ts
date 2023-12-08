// TODO: layer effects
// TODO: undo/redo somehow
// TODO: load image layer
// TODO: fill tool

import {
  GlueCanvas,
  glueGetSourceDimensions,
  glueIsSourceLoaded,
} from 'fxglue';
import { nanoid } from 'nanoid';
import { MoveTool } from './tools/move';
import { BrushTool } from './tools/brush';
import { EditorSelection, EditorState, Layer, Point, Tool } from './types';
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
uniform vec2 iOffset;

float clipped(vec2 uv) {
  float val = texture2D(iImage, uv).a;
  return clip(uv) * val;
}

void main() {
  vec2 p = gl_FragCoord.xy / iResolution;
  vec2 uv = gl_FragCoord.xy / iResolution;

  uv.x -= iOffset.x/iResolution.x;
  uv.y += iOffset.y/iResolution.y - 1.0 + iSize.y / iResolution.y;
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

const layerBoundsFragment = `
@use wrap

uniform vec2 iOffset;
uniform vec2 iSize;

void main() {
  vec2 p = gl_FragCoord.xy / iResolution;
  vec2 uv = gl_FragCoord.xy / iResolution;

  uv.x -= iOffset.x;
  uv.y += iOffset.y - 1.0 + iSize.y / iResolution.y;
  uv *= iResolution / iSize;

  vec4 src = texture2D(iTexture, p);

  if (uv.x > 0.0 && uv.y > 0.0 && uv.x < 1.0 && uv.y < 1.0 && (uv.x < 0.002 || uv.y < 0.002 || 1.0 - uv.x < 0.002 || 1.0 - uv.y < 0.002)) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
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
  };
  selection: EditorSelection = {
    canvas: document.createElement('canvas'),
    offset: { x: 0, y: 0 },
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

    this.glue.registerTexture('~selection', this.selection.canvas);

    this.glue.registerProgram('~selectionEdge', selectionEdgeFragment);
    this.glue.registerProgram('~layerBounds', layerBoundsFragment);
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

  private newLayer(width = 512, height = 512) {
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

  imageLayer(image: HTMLImageElement, name?: string) {
    const [width, height] = glueGetSourceDimensions(image);
    const layer = this.newLayer(width, height);
    if (name) {
      layer.name = name;
    }

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

  renderLayers() {
    const glue = this.glue;
    const layers = [...this.state.layers].reverse();
    for (const layer of layers) {
      glue.texture(layer.id)?.update();
      glue.texture(layer.id)?.draw();
    }
  }

  render() {
    const glue = this.glue;
    this.glueCanvas.setSize(
      this.glueCanvas.canvas.clientWidth,
      this.glueCanvas.canvas.clientHeight,
    );

    this.renderLayers();

    glue.texture('~selection')?.update(this.selection.canvas);
    glue.texture('~selection')?.use();
    glue.program('~selectionEdge')?.apply({
      iImage: 1,
      iOffset: [this.selection.offset.x, this.selection.offset.y],
      iSize: [this.selection.canvas.width, this.selection.canvas.height],
    });

    const layer = this.currentLayer;
    if (layer) {
      glue.program('~layerBounds')?.apply({
        iOffset: [0, 0],
        iSize: [layer.canvas.width, layer.canvas.height],
      });
    }

    glue.render();
    setTimeout(() => {
      requestAnimationFrame(() => this.render());
    }, 50);
  }

  addImage(url: string, name?: string): Promise<void> {
    const source = new Image();
    source.src = url;

    return new Promise(resolve => {
      const onload = () => {
        this.imageLayer(source, name);
        resolve();
      };

      if (glueIsSourceLoaded(source)) {
        onload();
      } else {
        source.onload = onload;
      }
    });
  }

  renderSelection() {
    this.renderLayers();
    this.glue.render();
    this.glueCanvas.gl.flush();

    const canvas = document.createElement('canvas');
    canvas.width = this.selection.canvas.width;
    canvas.height = this.selection.canvas.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      this.glueCanvas.canvas,
      -this.selection.offset.x,
      -this.selection.offset.y,
    );
    return canvas.toDataURL('image/png');
  }
}
