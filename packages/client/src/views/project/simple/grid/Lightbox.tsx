import { ImageFile } from '@metastable/types';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  BsArrowLeft,
  BsArrowRight,
  BsArrowUpRightSquare,
  BsDownload,
  BsXLg,
} from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { ImagePreview } from '$components/imagePreview';
import { useHotkey } from '$hooks/useHotkey';
import { resolveImage } from '$utils/url';
import styles from './Lightbox.module.scss';

interface Props {
  images: ImageFile[];
  current?: number;
  onChange: (index: number) => void;
  onClose: () => void;
  actions?: (file: ImageFile) => React.ReactNode;
}

export const Lightbox: React.FC<Props> = ({
  images,
  current = 0,
  onChange,
  onClose,
  actions,
}) => {
  const thumbnailsRef = useRef<HTMLDivElement>(null);
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

  useHotkey('gallery_close', onClose);
  useHotkey('gallery_next', next);
  useHotkey('gallery_previous', previous);

  useEffect(() => {
    if (!thumbnailsRef.current) {
      return;
    }

    const el = thumbnailsRef.current.querySelector(`[data-i='${current}']`);
    if (el) {
      el.scrollIntoView();
    }
  }, [current]);

  const currentUrl = resolveImage(currentFile.mrn);

  return (
    <div className={styles.lightbox} onClick={onClose}>
      <div className={styles.header} onClick={e => e.stopPropagation()}>
        <div>
          {current + 1}/{images.length}
        </div>
        <div>{filename}</div>
        <div>
          {actions && currentFile ? actions(currentFile) : undefined}
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
      <div className={styles.thumbnailsWrapper}>
        <div
          className={styles.thumbnails}
          onClick={e => e.stopPropagation()}
          ref={thumbnailsRef}
        >
          {images.map((file, i) => {
            return (
              <img
                src={resolveImage(file.mrn, 'thumbnail')}
                key={i}
                onClick={() => onChange(i)}
                className={i === current ? styles.active : undefined}
                data-i={i}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
