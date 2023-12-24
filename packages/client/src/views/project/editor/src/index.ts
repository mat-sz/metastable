import { GlueCanvas, glueGetSourceDimensions } from 'fxglue';
import { nanoid } from 'nanoid';
import { MoveTool } from './tools/move';
import { BrushTool } from './tools/brush';
import {
  EditorSelection,
  EditorState,
  Layer,
  Point,
  PointerState,
  Tool,
} from './types';
import { EraserTool } from './tools/eraser';
import { SelectTool } from './tools/select';
import { loadImage } from '../../../../helpers';
import { PointerData, isVisible } from './helpers';
import { FillTool } from './tools/fill';
import { EyedropperTool } from './tools/eyedropper';

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

  uv.x -= iOffset.x;
  uv.y += iOffset.y - 1.0 + iSize.y / iResolution.y;
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

const backgroundFragment = `
@use wrap

uniform vec2 iOffset;
uniform float iScale;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.x;
  uv.x -= iOffset.x / iResolution.x;
  uv.y += iOffset.y / iResolution.x;
  uv *= iScale;

  float tileWidth = 16.0;
  float repeats = iResolution.x / tileWidth;
  float cx = floor(repeats * uv.x);
  float cy = floor(repeats * uv.y); 
  float result = mod(cx + cy, 2.0);
  float c = 0.3 + 0.1 * sign(result);

  gl_FragColor = vec4(c, c, c, 1.0);
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
    offset: { x: 1, y: 1 },
  };
  scale = 1;
  offset: Point = { x: 0, y: 0 };

  glueCanvas = new GlueCanvas();
  glue = this.glueCanvas.glue;

  tools: Record<string, Tool> = {
    move: new MoveTool(this),
    select: new SelectTool(this),
    brush: new BrushTool(this),
    eraser: new EraserTool(this),
    fill: new FillTool(this),
    eyedropper: new EyedropperTool(this),
  };
  currentToolId = 'move';

  private _shouldRender = false;

  private _foregroundColor = '#000000';
  private _backgroundColor = '#ffffff';

  private _pointerState: PointerState | undefined = undefined;

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

    this.selection.canvas.width = 0;
    this.selection.canvas.height = 0;
    this.render();

    const canvas = this.glueCanvas.canvas;
    canvas.addEventListener('pointerdown', e => {
      const point = this.pointerEventToPoint(e);
      const action = e.button === 0 ? 'primary' : 'secondary';
      this._pointerState = { startPoint: point, lastPoint: point, action };
      this.currentTool.down?.(new PointerData(this, point, this._pointerState));
    });
    canvas.addEventListener('pointermove', e => {
      const point = this.pointerEventToPoint(e);

      this.currentTool.move?.(new PointerData(this, point, this._pointerState));
      if (this._pointerState) {
        this._pointerState.lastPoint = point;
      }
    });
    canvas.addEventListener('pointerup', e => {
      const point = this.pointerEventToPoint(e);

      this.currentTool.up?.(new PointerData(this, point, this._pointerState));
      this._pointerState = undefined;
    });

    this.glue.registerTexture('~selection', this.selection.canvas);

    this.glue.registerProgram('~background', backgroundFragment);
    this.glue.registerProgram('~selectionEdge', selectionEdgeFragment);
    this.glue.registerProgram('~layerBounds', layerBoundsFragment);

    setInterval(() => {
      this.checkVisibility();
    }, 100);
  }

  private checkVisibility() {
    this._shouldRender = isVisible(this.glueCanvas.canvas);
  }

  pointerEventToPoint(e: PointerEvent): Point {
    const rect = this.glueCanvas.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  scalePoint(point: Point): Point {
    return {
      x: point.x / this.scale - this.offset.x,
      y: point.y / this.scale - this.offset.y,
    };
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
    tool.reset?.();
    this.emit('toolChanged');
  }

  updateToolSettings(newSettings: any) {
    this.currentTool.settings = newSettings;
    this.emit('toolSettingsChanged');
  }

  private newLayer(width = 512, height = 512, options: Partial<Layer> = {}) {
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
      offset: { x: 0, y: 0 },
      ...options,
    };
    return layer;
  }

  emptyLayer(options: Partial<Layer> = {}) {
    const layer = this.newLayer(512, 512, options);
    this.state.layers.unshift(layer);
    this.state.currentLayerId = layer.id;

    this.emit('state');
  }

  imageLayer(image: HTMLImageElement, options: Partial<Layer> = {}) {
    const [width, height] = glueGetSourceDimensions(image);
    const layer = this.newLayer(width, height, options);

    const ctx = layer.canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    this.state.layers.unshift(layer);
    this.state.currentLayerId = layer.id;

    this.emit('state');
  }

  selectLayer(id: string) {
    this.state.currentLayerId = id;
    this.emit('state');
  }

  duplicateLayer(id: string) {
    const layer = this.state.layers.find(layer => layer.id === id);
    if (!layer) {
      return;
    }

    const layerIndex = this.state.layers.findIndex(layer => layer.id === id);
    const newLayer = this.newLayer(layer.canvas.width, layer.canvas.height, {
      name: `${layer.name} copy`,
      offset: { ...layer.offset },
    });

    const ctx = newLayer.canvas.getContext('2d')!;
    ctx.drawImage(layer.canvas, 0, 0);

    this.state.layers.splice(layerIndex, 0, newLayer);
    this.state.currentLayerId = newLayer.id;

    this.emit('state');
  }

  deleteLayer(id: string) {
    const layer = this.state.layers.find(layer => layer.id === id);
    if (!layer) {
      return;
    }

    if (layer.id === this.state.currentLayerId) {
      if (this.state.layers.length > 1) {
        const layerIndex = this.state.layers.findIndex(
          layer => layer.id === id,
        );
        this.state.currentLayerId =
          this.state.layers[layerIndex === 0 ? 1 : layerIndex - 1]?.id;
      } else {
        this.state.currentLayerId = undefined;
      }
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
      glue.texture(layer.id)?.draw({
        x: layer.offset.x,
        y: layer.offset.y,
        width: layer.canvas.width,
        height: layer.canvas.height,
      });
    }
  }

  render() {
    if (!this._shouldRender) {
      setTimeout(() => {
        requestAnimationFrame(() => this.render());
      }, 100);
      return;
    }

    const glue = this.glue;
    const gl = this.glueCanvas.gl;
    this.glueCanvas.setSize(
      this.glueCanvas.canvas.clientWidth || 1,
      this.glueCanvas.canvas.clientHeight || 1,
    );
    glue.setScale(this.scale);
    glue.setOffset(this.offset.x, this.offset.y);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    glue.program('~background')?.apply({
      iScale: this.scale,
      iOffset: [this.offset.x, this.offset.y],
    });

    this.renderLayers();

    glue.texture('~selection')?.update(this.selection.canvas);
    glue.texture('~selection')?.use();
    glue.program('~selectionEdge')?.apply({
      iImage: 1,
      ...glue.layerUniforms(
        this.selection.offset.x,
        this.selection.offset.y,
        this.selection.canvas.width,
        this.selection.canvas.height,
      ),
    });

    const layer = this.currentLayer;
    if (layer) {
      glue.program('~layerBounds')?.apply({
        ...glue.layerUniforms(
          layer.offset.x,
          layer.offset.y,
          layer.canvas.width,
          layer.canvas.height,
        ),
      });
    }

    glue.render();
    setTimeout(() => {
      requestAnimationFrame(() => this.render());
    }, 16);
  }

  async addImage(url: string, options: Partial<Layer> = {}): Promise<void> {
    const source = await loadImage(url);
    this.imageLayer(source, options);
  }

  renderArea(x: number, y: number, width: number, height: number) {
    const glue = this.glue;
    this.glueCanvas.setSize(width, height);
    glue.setScale(1);
    glue.setOffset(-x, -y);

    const gl = this.glueCanvas.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    this.renderLayers();
    this.glue.render();
    gl.flush();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.glueCanvas.canvas, 0, 0);
    return canvas;
  }

  renderSelection() {
    let { width, height } = this.selection.canvas;
    let { x, y } = this.selection.offset;

    if (!width || !height) {
      width = this.currentLayer?.canvas.width || 512;
      height = this.currentLayer?.canvas.width || 512;
      x = this.currentLayer?.offset.x || 0;
      y = this.currentLayer?.offset.y || 0;
    }

    const canvas = this.renderArea(x, y, width, height);
    return canvas.toDataURL('image/png');
  }
}
