import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BsArrowRepeat,
  BsBrush,
  BsCircleFill,
  BsEraser,
  BsSquareFill,
  BsXLg,
} from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { VarSlider, VarSwitch, VarUI } from '$components/var';
import { linePoints } from '$editor/helpers';
import { Vector2 } from '$editor/primitives/Vector2';
import { Point } from '$editor/types';
import { loadImage } from '$utils/image';
import styles from './index.module.scss';

interface Props {
  imageSrc: string;
  maskSrc?: string;
  onClose: (mask?: string) => void;
}

interface PointerState {
  start: Vector2;
  previous: Vector2;
  current: Vector2;
  imageOffset: Vector2;
  pointerId: number;
  scale: number;
}

const MAX_SCALE = 3;
const MIN_SCALE = 0.25;

export const MaskEditor: React.FC<Props> = ({ imageSrc, maskSrc, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>();
  const maskCanvasRef = useRef<HTMLCanvasElement>();

  const [tool, setTool] = useState('add');
  const [loaded, setLoaded] = useState(false);
  const [brushSettings, setBrushSettings] = useState({
    size: 10,
    type: 'square',
  });
  const brushStateRef = useRef({ tool, brushSettings });
  const scaleRef = useRef(1);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const pointerStateRef = useRef<PointerState[]>([]);
  const brushPositionRef = useRef<Point>();
  const pointerActionRef = useRef<string>();
  const lastDrawRef = useRef(0);

  useEffect(() => {
    brushStateRef.current = { tool, brushSettings };
  }, [brushSettings, tool]);

  const resetScale = useCallback(() => {
    const height = imageRef.current!.naturalHeight;
    const width = imageRef.current!.naturalWidth;
    const scale = Math.max(
      Math.min(
        window.innerWidth / width,
        window.innerHeight / height,
        MAX_SCALE,
      ),
      MIN_SCALE,
    );

    const vector = Vector2.fromSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })
      .sub(new Vector2(width, height).multiplyScalar(scale))
      .divideScalar(2);
    offsetRef.current = vector.point;
    scaleRef.current = scale;
  }, []);

  const refresh = useCallback(async () => {
    setLoaded(false);
    const image = await loadImage(imageSrc);
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = image.naturalWidth;
    maskCanvas.height = image.naturalHeight;
    const ctx = maskCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = '#000000';

    if (maskSrc) {
      const mask = await loadImage(maskSrc);
      ctx.drawImage(mask, 0, 0, image.naturalWidth, image.naturalHeight);
    }

    imageRef.current = image;
    maskCanvasRef.current = maskCanvas;

    resetScale();
    setLoaded(true);
  }, [maskSrc, imageSrc, setLoaded, resetScale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const image = imageRef.current;
      if (!canvas || !image || !maskCanvas) {
        requestAnimationFrame(render);
        return;
      }

      const offset = offsetRef.current;
      const scale = scaleRef.current;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        offset.x,
        offset.y,
        image.naturalWidth * scale,
        image.naturalHeight * scale,
      );

      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.filter = 'invert(62%) sepia(45%) saturate(7242%) hue-rotate(218deg)';
      ctx.drawImage(
        maskCanvas,
        offset.x,
        offset.y,
        image.naturalWidth * scale,
        image.naturalHeight * scale,
      );
      ctx.restore();

      if (brushPositionRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.strokeStyle = '#ffffff';
        const { x, y } = brushPositionRef.current;

        const settings = brushStateRef.current.brushSettings;
        const size = settings.size * scale;

        switch (settings.type) {
          case 'square':
            ctx.strokeRect(x - size / 2, y - size / 2, size, size);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        }
        ctx.restore();
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }, []);

  const zoom = (e: React.WheelEvent) => {
    e.stopPropagation();

    if (e.shiftKey) {
      setBrushSettings(current => ({
        ...current,
        size: Math.max(
          1,
          e.deltaY < 0
            ? Math.ceil(current.size * 1.1)
            : Math.floor(current.size * 0.9),
        ),
      }));
    } else {
      const newScale = scaleRef.current * (1 - Math.sign(e.deltaY) * 0.1);
      const scaleRatio = newScale / scaleRef.current;

      const vector = Vector2.fromEvent(e)
        .multiplyScalar(1 - scaleRatio)
        .add(Vector2.fromPoint(offsetRef.current).multiplyScalar(scaleRatio));

      offsetRef.current = vector.point;
      scaleRef.current = newScale;

      const p = pointerStateRef.current[0];
      if (p) {
        p.imageOffset = vector.clone();
        p.start = Vector2.fromEvent(e);
      }
    }
  };

  const pan = () => {
    const pointers = pointerStateRef.current;

    if (pointers.length === 1) {
      const p = pointers[0];
      const vector = p.imageOffset.clone().sub(p.start).add(p.current);

      offsetRef.current = vector.point;
    } else if (pointers.length === 2) {
      const [first, second] = pointers;
      const scaleRatio =
        first.current.distanceTo(second.current) /
        first.start.distanceTo(second.start);
      const startCenter = first.start.clone().midpoint(second.start);
      const currentCenter = first.current.clone().midpoint(second.current);

      const vector = startCenter
        .clone()
        .multiplyScalar(1 - scaleRatio)
        .add(
          second.imageOffset
            .clone()
            .add(currentCenter)
            .sub(startCenter)
            .multiplyScalar(scaleRatio),
        );

      offsetRef.current = vector.point;
      scaleRef.current = second.scale * scaleRatio;
    }
  };

  const draw = (line = true) => {
    const pointers = pointerStateRef.current;

    if (pointers.length === 1) {
      const p = pointers[0];
      const offset = Vector2.fromPoint(offsetRef.current);
      const scale = scaleRef.current;
      const previous = p.previous.clone().sub(offset).divideScalar(scale);

      const current = p.current.clone().sub(offset).divideScalar(scale);

      const canvas = maskCanvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      const { tool, brushSettings } = brushStateRef.current;
      const { size, type } = brushSettings;

      if (tool === 'subtract') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (type === 'square') {
        let points: Point[] = [current.point];
        if (line && previous) {
          const distance = current.distanceTo(Vector2.fromPoint(previous));
          if (distance > Math.SQRT2) {
            points = linePoints(previous, current);
          }
        }

        for (const point of points) {
          const x = Math.round(point.x - size / 2);
          const y = Math.round(point.y - size / 2);
          ctx.fillRect(x, y, size, size);
        }
      } else {
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
    }
  };

  return (
    <div className={styles.editor}>
      {!loaded && <div className={styles.loading}>Loading...</div>}
      <canvas
        onWheel={zoom}
        onClick={e => e.stopPropagation()}
        onPointerDown={e => {
          e.preventDefault();
          if (e.pointerType === 'mouse' && e.button !== 1) {
            pointerActionRef.current = 'draw';
          } else {
            pointerActionRef.current = 'pan';
          }

          const state = pointerStateRef.current;
          const i = state.findIndex(p => p.pointerId === e.pointerId);

          const pointerState = {
            start: Vector2.fromEvent(e),
            previous: Vector2.fromEvent(e),
            current: Vector2.fromEvent(e),
            imageOffset: Vector2.fromPoint(offsetRef.current),
            pointerId: e.pointerId,
            scale: scaleRef.current,
          };

          if (i !== -1) {
            state[i] = pointerState;
          } else {
            state.push(pointerState);
          }

          if (pointerActionRef.current === 'draw') {
            draw(false);
          }
        }}
        onPointerLeave={() => {
          brushPositionRef.current = undefined;
        }}
        onPointerMove={e => {
          e.preventDefault();

          brushPositionRef.current = { x: e.clientX, y: e.clientY };
          if (pointerActionRef.current === 'draw') {
            if (Date.now() - lastDrawRef.current > 20) {
              lastDrawRef.current = Date.now();
            } else {
              return;
            }
          }

          const state = pointerStateRef.current;
          const i = state.findIndex(p => p.pointerId === e.pointerId);
          if (i !== -1) {
            state[i].previous = state[i].current;
            state[i].current = Vector2.fromEvent(e);
          }

          switch (pointerActionRef.current) {
            case 'pan':
              pan();
              break;
            case 'draw':
              draw();
              break;
          }
        }}
        onPointerUp={e => {
          const state = pointerStateRef.current;
          const i = state.findIndex(p => p.pointerId === e.pointerId);
          if (i !== -1) {
            if (pointerActionRef.current === 'draw') {
              state[i].previous = state[i].current;
              state[i].current = Vector2.fromEvent(e);
              draw();
            }

            state.splice(i, 1);

            if (state.length === 1) {
              state[0].imageOffset = Vector2.fromPoint(offsetRef.current);
              state[0].start = state[0].current.clone();
            }
          }

          pointerActionRef.current = undefined;
        }}
        draggable={false}
        ref={canvasRef}
      />
      <div className={styles.header}>
        <div className={styles.tools}>
          <IconButton
            className={clsx({ [styles.active]: tool === 'add' })}
            onClick={() => {
              setTool('add');
            }}
          >
            <BsBrush />
          </IconButton>
          <IconButton
            className={clsx({ [styles.active]: tool === 'subtract' })}
            onClick={() => {
              setTool('subtract');
            }}
          >
            <BsEraser />
          </IconButton>
        </div>
        <VarUI
          values={brushSettings}
          onChange={setBrushSettings}
          className={styles.toolSettings}
        >
          <VarSlider
            label="Size"
            path="size"
            className={styles.size}
            min={1}
            max={100}
            inputMin={1}
            inputMax={1000}
            showInput
            step={1}
            unit="px"
          />
          <VarSwitch
            label="Shape"
            path="type"
            switchClassName={styles.switch}
            options={[
              { key: 'square', label: <BsSquareFill /> },
              { key: 'circle', label: <BsCircleFill /> },
            ]}
          />
        </VarUI>
        <div className={styles.actions}>
          <IconButton
            onClick={() => {
              const maskCanvas = maskCanvasRef.current;
              if (!maskCanvas) {
                return;
              }

              const ctx = maskCanvas.getContext('2d')!;
              ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            }}
          >
            <BsArrowRepeat />
          </IconButton>
          <IconButton
            onClick={() => {
              onClose(maskCanvasRef.current?.toDataURL());
            }}
          >
            <BsXLg />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
