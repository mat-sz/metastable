import React, { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  BsArrowLeft,
  BsArrowRight,
  BsArrowUpRightSquare,
  BsDownload,
  BsXLg,
} from 'react-icons/bs';

import { IconButton } from '@components/iconButton';
import { ImagePreview } from '@components/imagePreview';
import styles from './Lightbox.module.scss';

interface Props {
  images: [url: string, thumb: string][];
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
  const filename = currentUrl[0].split('/').slice(-1)[0];

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
        <div>{filename}</div>
        <div>
          <IconButton href={currentUrl[0]} download={filename}>
            <BsDownload />
          </IconButton>
          <IconButton href={currentUrl[0]}>
            <BsArrowUpRightSquare />
          </IconButton>
          <IconButton onClick={onClose}>
            <BsXLg />
          </IconButton>
        </div>
      </div>
      <div className={styles.main}>
        <button
          onClick={e => {
            e.stopPropagation();
            previous();
          }}
        >
          <BsArrowLeft />
        </button>
        <ImagePreview url={currentUrl[0]} />
        <button
          onClick={e => {
            e.stopPropagation();
            next();
          }}
        >
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
              src={url[1]}
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
