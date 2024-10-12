import { ProjectImageFile } from '@metastable/types';
import React, { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  BsArrowLeft,
  BsArrowRight,
  BsArrowUpRightSquare,
  BsDownload,
  BsXLg,
} from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { ImagePreview } from '$components/imagePreview';
import styles from './Lightbox.module.scss';

interface Props {
  images: ProjectImageFile[];
  current?: number;
  onChange: (index: number) => void;
  onClose: () => void;
  actions?: (file: ProjectImageFile) => React.ReactNode;
}

export const Lightbox: React.FC<Props> = ({
  images,
  current = 0,
  onChange,
  onClose,
  actions,
}) => {
  const currentFile = images[current];
  const filename = currentFile.name;

  const previous = useCallback(
    () => onChange(current === 0 ? images.length - 1 : current - 1),
    [onChange, current, images.length],
  );
  const next = useCallback(
    () => onChange(current === images.length - 1 ? 0 : current + 1),
    [onChange, current, images.length],
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
          {actions && currentFile ? actions(currentFile) : undefined}
          <IconButton href={currentFile.image.url} download={filename}>
            <BsDownload />
          </IconButton>
          <IconButton href={currentFile.image.url}>
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
        <ImagePreview url={currentFile.image.url} />
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
        {images.map((file, i) => {
          if (Math.abs(current - i) > 5) {
            return undefined;
          }

          return (
            <img
              src={file.image.thumbnailUrl}
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
