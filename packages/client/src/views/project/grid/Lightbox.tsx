import React, { useCallback } from 'react';

import styles from './Lightbox.module.scss';
import { BsArrowLeft, BsArrowRight, BsX } from 'react-icons/bs';
import { ImagePreview } from '../../../components';
import { useHotkeys } from 'react-hotkeys-hook';

interface Props {
  images: string[];
  current?: number;
  onChange: (index: number) => void;
  onClose: () => void;
}

export const Lightbox: React.FC<Props> = ({
  images,
  current = 0,
  onChange,
  onClose,
}) => {
  const currentUrl = images[current];

  const previous = useCallback(
    () => onChange(current === 0 ? images.length - 1 : current - 1),
    [onChange, current],
  );
  const next = useCallback(
    () => onChange(current === images.length - 1 ? 0 : current + 1),
    [onChange, current],
  );

  useHotkeys('escape', onClose);
  useHotkeys('left', previous);
  useHotkeys('right', next);

  return (
    <div className={styles.lightbox} onClick={onClose}>
      <div className={styles.header} onClick={e => e.stopPropagation()}>
        <div>
          {current + 1}/{images.length}
        </div>
        <div>
          <button onClick={onClose}>
            <BsX />
          </button>
        </div>
      </div>
      <div className={styles.main} onClick={e => e.stopPropagation()}>
        <button onClick={previous}>
          <BsArrowLeft />
        </button>
        <ImagePreview url={currentUrl} />
        <button onClick={next}>
          <BsArrowRight />
        </button>
      </div>
      <div className={styles.thumbnails} onClick={e => e.stopPropagation()}>
        {images.map((url, i) => {
          if (Math.abs(current - i) > 5) {
            return undefined;
          }

          return (
            <img
              src={url}
              key={i}
              onClick={() => onChange(i)}
              className={i === current ? styles.active : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};
