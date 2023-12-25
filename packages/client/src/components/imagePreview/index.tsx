import React, { useCallback, useEffect, useRef, useState } from 'react';

import styles from './index.module.scss';
import { Vector2 } from '../../views/project/editor/src/primitives/Vector2';

interface ImagePreviewProps {
  url?: string;
}

interface Position {
  x: number;
  y: number;
}

interface PointerState {
  start: Vector2;
  current: Vector2;
  pointerId: number;
  imageOffset: Vector2;
  scale: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ url }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointerStateRef = useRef<PointerState[]>([]);

  const [scale, setScale] = useState(1);
  const [imageOffset, setImageOffset] = useState<Position>({ x: 0, y: 0 });

  const resetScale = useCallback(() => {
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
  }, [setScale, setImageOffset]);

  useEffect(() => {
    const onResize = () => {
      resetScale();
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [resetScale]);

  if (!url) {
    return <div className={styles.preview} />;
  }

  const zoom = (e: React.WheelEvent) => {
    const wrapperRect = wrapperRef.current!.getBoundingClientRect();
    const step = Math.sign(e.deltaY) * (scale * -0.1);

    let newScale = scale + step;
    if (newScale < 0.25) newScale = 0.25;
    if (newScale > 3) newScale = 3;

    const scaleRatio = newScale / scale;

    const vector = Vector2.fromEvent(e)
      .sub(Vector2.fromPoint(wrapperRect))
      .multiplyScalar(1 - scaleRatio)
      .add(Vector2.fromPoint(imageOffset).multiplyScalar(scaleRatio));

    setImageOffset(vector.point);
    setScale(newScale);
    if (pointerStateRef.current[0]) {
      pointerStateRef.current[0].imageOffset = vector.clone();
      pointerStateRef.current[0].start = Vector2.fromEvent(e);
    }
  };

  const pan = () => {
    const pointers = pointerStateRef.current;

    if (pointers.length === 1) {
      const p = pointers[0];

      setImageOffset({
        x: p.imageOffset.x - p.start.x + p.current.x,
        y: p.imageOffset.y - p.start.y + p.current.y,
      });
    } else if (pointers.length === 2) {
      const startDistance = pointers[0].start.distanceTo(pointers[1].start);
      const currentDistance = pointers[0].current.distanceTo(
        pointers[1].current,
      );
      const scaleRatio = currentDistance / startDistance;
      const newScale = pointers[1].scale * scaleRatio;

      const startCenter = pointers[0].start.clone().midpoint(pointers[1].start);
      const center = pointers[0].current.clone().midpoint(pointers[1].current);

      const wrapperRect = wrapperRef.current!.getBoundingClientRect();
      const vector = startCenter
        .clone()
        .sub(Vector2.fromPoint(wrapperRect))
        .multiplyScalar(1 - scaleRatio)
        .add(
          pointers[1].imageOffset
            .clone()
            .add(center)
            .sub(startCenter)
            .multiplyScalar(scaleRatio),
        );
      setImageOffset(vector.point);
      setScale(newScale);
    }
  };

  return (
    <div
      className={styles.preview}
      ref={wrapperRef}
      onWheel={zoom}
      onPointerDown={e => {
        e.preventDefault();
        pointerStateRef.current.push({
          start: Vector2.fromEvent(e),
          current: Vector2.fromEvent(e),
          pointerId: e.pointerId,
          imageOffset: Vector2.fromPoint(imageOffset),
          scale: scale,
        });
      }}
      onPointerMove={e => {
        e.preventDefault();
        const i = pointerStateRef.current.findIndex(
          state => state.pointerId === e.pointerId,
        );
        if (i !== -1) {
          pointerStateRef.current[i].current = Vector2.fromEvent(e);
        }

        pan();
      }}
      onPointerUp={e => {
        const i = pointerStateRef.current.findIndex(
          state => state.pointerId === e.pointerId,
        );
        if (i !== -1) {
          pointerStateRef.current.splice(i, 1);
        }
        if (pointerStateRef.current.length === 1) {
          (pointerStateRef.current[0].imageOffset =
            Vector2.fromPoint(imageOffset)),
            (pointerStateRef.current[0].start =
              pointerStateRef.current[0].current.clone());
        }
      }}
      onDoubleClick={resetScale}
    >
      <img
        src={url}
        ref={imageRef}
        draggable={false}
        onLoad={() => {
          resetScale();
        }}
        style={{
          transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${scale}) `,
        }}
      />
    </div>
  );
};
