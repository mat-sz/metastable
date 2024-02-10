import React, { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import styles from './Lightbox.module.scss';
import {
  BsArrowLeft,
  BsArrowRight,
  BsArrowUpRightSquare,
  BsDownload,
  BsXLg,
} from 'react-icons/bs';
import { IconButton, ImagePreview } from '../../../../components';

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
  const filename = currentUrl.split('/').slice(-1)[0];

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
          <IconButton href={currentUrl} download={filename}>
            <BsDownload />
          </IconButton>
          <IconButton href={currentUrl}>
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
        <ImagePreview url={currentUrl} />
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
