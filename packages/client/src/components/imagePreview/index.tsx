import clsx from 'clsx';
import React, { useCallback, useRef, useState } from 'react';

import { Vector2 } from '$editor/primitives/Vector2';
import { Point, Size } from '$editor/types';
import { useEventListener } from '$hooks/useEventListener';
import { useResizeObserver } from '$hooks/useResizeObserver';
import styles from './index.module.scss';

interface ImagePreviewProps {
  className?: string;
  url?: string;
}

interface PointerState {
  start: Vector2;
  current: Vector2;
  imageOffset: Vector2;
  pointerId: number;
  scale: number;
}

interface ImageState {
  offset: Point;
  scale: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  className,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointerStateRef = useRef<PointerState[]>([]);
  const wrapperSizeRef = useRef<Size>({ width: 0, height: 0 });
  const imageStateRef = useRef<ImageState>({
    offset: { x: 0, y: 0 },
    scale: 1,
  });

  const [loaded, setLoaded] = useState(false);

  const updateRect = useCallback(() => {
    const wrapperEl = wrapperRef.current;
    const rect = wrapperEl?.getBoundingClientRect();
    wrapperSizeRef.current = rect
      ? { width: rect.width, height: rect.height }
      : { width: 0, height: 0 };
    return wrapperSizeRef.current;
  }, []);

  const syncState = useCallback((state: Partial<ImageState>) => {
    const imageEl = imageRef.current;
    if (!imageEl) {
      return;
    }

    imageStateRef.current = { ...imageStateRef.current, ...state };
    const { offset, scale } = imageStateRef.current;
    imageEl.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  }, []);

  const resetScale = useCallback(() => {
    const size = updateRect();
    const { naturalHeight: height, naturalWidth: width } = imageRef.current!;
    const scale = Math.min(size.width / width, size.height / height);

    const vector = Vector2.fromSize(size)
      .sub(new Vector2(width, height).multiplyScalar(scale))
      .divideScalar(2);
    syncState({
      offset: vector.point,
      scale,
    });
  }, [setLoaded, syncState, updateRect]);

  const onResize = useCallback(() => {
    const oldSize = wrapperSizeRef.current;
    const newSize = updateRect();

    const diffWidth = newSize.width - oldSize.width;
    const diffHeight = newSize.height - oldSize.height;

    const { offset } = imageStateRef.current;
    syncState({
      offset: {
        x: offset.x + diffWidth / 2,
        y: offset.y + diffHeight / 2,
      },
    });
  }, [updateRect, syncState]);
  useResizeObserver(onResize, wrapperRef);

  if (!url) {
    return <div className={styles.preview} />;
  }

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const isTrackpad =
        (e as any).wheelDeltaY === e.deltaY * -3 || e.deltaMode === 0;

      if (isTrackpad && !e.ctrlKey) {
        const { offset } = imageStateRef.current;

        const changeVector = new Vector2(e.deltaX, e.deltaY).multiplyScalar(-1);
        const vector = Vector2.fromPoint(offset).add(changeVector);

        syncState({
          offset: vector.point,
        });
      } else {
        const { scale, offset } = imageStateRef.current;
        const newScale = scale * (1 - Math.sign(e.deltaY) * 0.1);
        const scaleRatio = newScale / scale;
        const wrapperRect = wrapperRef.current!.getBoundingClientRect();

        const vector = Vector2.fromEvent(e)
          .sub(Vector2.fromPoint(wrapperRect))
          .multiplyScalar(1 - scaleRatio)
          .add(Vector2.fromPoint(offset).multiplyScalar(scaleRatio));

        syncState({
          offset: vector.point,
          scale: newScale,
        });

        const p = pointerStateRef.current[0];
        if (p) {
          p.imageOffset = vector.clone();
          p.start = Vector2.fromEvent(e);
        }
      }
    },
    [syncState],
  );

  const pan = () => {
    const pointers = pointerStateRef.current;

    if (pointers.length === 1) {
      const p = pointers[0];
      const vector = p.imageOffset.clone().sub(p.start).add(p.current);

      syncState({
        offset: vector.point,
      });
    } else if (pointers.length === 2) {
      const [first, second] = pointers;
      const scaleRatio =
        first.current.distanceTo(second.current) /
        first.start.distanceTo(second.start);
      const startCenter = first.start.clone().midpoint(second.start);
      const currentCenter = first.current.clone().midpoint(second.current);
      const wrapperRect = wrapperRef.current!.getBoundingClientRect();

      const vector = startCenter
        .clone()
        .sub(Vector2.fromPoint(wrapperRect))
        .multiplyScalar(1 - scaleRatio)
        .add(
          second.imageOffset
            .clone()
            .add(currentCenter)
            .sub(startCenter)
            .multiplyScalar(scaleRatio),
        );

      syncState({
        offset: vector.point,
        scale: second.scale * scaleRatio,
      });
    }
  };

  useEventListener('wheel', onWheel, wrapperRef, { passive: false });

  return (
    <div
      className={clsx(styles.preview, className)}
      ref={wrapperRef}
      onClick={e => e.stopPropagation()}
      onDoubleClick={() => resetScale()}
      onPointerDown={e => {
        e.preventDefault();

        if (e.pointerType === 'mouse' && e.button !== 0) {
          return;
        }

        const state = pointerStateRef.current;
        const i = state.findIndex(p => p.pointerId === e.pointerId);

        const { offset, scale } = imageStateRef.current;
        const pointerState = {
          start: Vector2.fromEvent(e),
          current: Vector2.fromEvent(e),
          imageOffset: Vector2.fromPoint(offset),
          pointerId: e.pointerId,
          scale: scale,
        };

        if (i !== -1) {
          state[i] = pointerState;
        } else {
          state.push(pointerState);
        }
      }}
      onPointerMove={e => {
        e.preventDefault();

        const state = pointerStateRef.current;
        const i = state.findIndex(p => p.pointerId === e.pointerId);
        if (i !== -1) {
          state[i].current = Vector2.fromEvent(e);
        }

        pan();
      }}
      onPointerUp={e => {
        const state = pointerStateRef.current;
        const i = state.findIndex(p => p.pointerId === e.pointerId);
        if (i !== -1) {
          state.splice(i, 1);

          if (state.length === 1) {
            const { offset } = imageStateRef.current;
            state[0].imageOffset = Vector2.fromPoint(offset);
            state[0].start = state[0].current.clone();
          }
        }
      }}
    >
      <img
        src={url}
        ref={imageRef}
        draggable={false}
        onLoadStart={() => {
          setLoaded(false);
        }}
        onLoad={() => {
          resetScale();
          setLoaded(true);
        }}
        style={{
          opacity: loaded ? 1 : 0.0001,
        }}
      />
      {!loaded && <div>Loading...</div>}
    </div>
  );
};
