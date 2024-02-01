import React, { useCallback, useEffect, useRef, useState } from 'react';

import styles from './index.module.scss';
import { Vector2 } from '../../views/project/editor/src/primitives/Vector2';
import { Point } from '../../views/project/editor/src/types';

interface ImagePreviewProps {
  url?: string;
}

interface PointerState {
  start: Vector2;
  current: Vector2;
  imageOffset: Vector2;
  pointerId: number;
  scale: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ url }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointerStateRef = useRef<PointerState[]>([]);

  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [imageOffset, setImageOffset] = useState<Point>({ x: 0, y: 0 });

  const resetScale = useCallback(
    (isLoad = false) => {
      const wrapperRect = wrapperRef.current!.getBoundingClientRect();

      const height = imageRef.current!.naturalHeight;
      const width = imageRef.current!.naturalWidth;
      const scale = Math.max(
        Math.min(wrapperRect.width / width, wrapperRect.height / height, 1),
        0.25,
      );

      const vector = Vector2.fromSize(wrapperRect)
        .sub(new Vector2(width, height).multiplyScalar(scale))
        .divideScalar(2);
      setImageOffset(vector.point);
      setScale(scale);
      if (isLoad) {
        setLoaded(true);
      }
    },
    [setScale, setImageOffset, setLoaded],
  );

  useEffect(() => {
    const onResize = () => {
      resetScale();
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resetScale]);

  useEffect(() => {
    setLoaded(false);
  }, [url, setLoaded]);

  if (!url) {
    return <div className={styles.preview} />;
  }

  const zoom = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newScale = scale * (1 - Math.sign(e.deltaY) * 0.1);
    const scaleRatio = newScale / scale;
    const wrapperRect = wrapperRef.current!.getBoundingClientRect();

    const vector = Vector2.fromEvent(e)
      .sub(Vector2.fromPoint(wrapperRect))
      .multiplyScalar(1 - scaleRatio)
      .add(Vector2.fromPoint(imageOffset).multiplyScalar(scaleRatio));

    setImageOffset(vector.point);
    setScale(newScale);

    const p = pointerStateRef.current[0];
    if (p) {
      p.imageOffset = vector.clone();
      p.start = Vector2.fromEvent(e);
    }
  };

  const pan = () => {
    const pointers = pointerStateRef.current;

    if (pointers.length === 1) {
      const p = pointers[0];
      const vector = p.imageOffset.clone().sub(p.start).add(p.current);

      setImageOffset(vector.point);
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

      setImageOffset(vector.point);
      setScale(second.scale * scaleRatio);
    }
  };

  return (
    <div
      className={styles.preview}
      ref={wrapperRef}
      onWheel={zoom}
      onPointerDown={e => {
        e.preventDefault();

        const state = pointerStateRef.current;
        const i = state.findIndex(p => p.pointerId === e.pointerId);

        const pointerState = {
          start: Vector2.fromEvent(e),
          current: Vector2.fromEvent(e),
          imageOffset: Vector2.fromPoint(imageOffset),
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
            state[0].imageOffset = Vector2.fromPoint(imageOffset);
            state[0].start = state[0].current.clone();
          }
        }
      }}
      onDoubleClick={() => resetScale()}
    >
      <img
        src={url}
        ref={imageRef}
        draggable={false}
        onLoad={() => {
          resetScale(true);
        }}
        style={{
          transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${scale}) `,
          opacity: loaded ? 1 : 0.0001,
        }}
      />
      {!loaded && <div>Loading...</div>}
    </div>
  );
};
