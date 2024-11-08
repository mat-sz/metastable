import { ImageFile } from '@metastable/types';
import clsx from 'clsx';
import React, { useState } from 'react';
import { BsFolder, BsFolderFill } from 'react-icons/bs';

import { API } from '$api';
import { Breadcrumbs } from '$components/breadcrumbs';
import { IconButton } from '$components/iconButton';
import { arrayStartsWith } from '$utils/array';
import { IS_ELECTRON } from '$utils/config';
import { resolveImage } from '$utils/url';
import styles from './ImageBrowser.module.scss';

export interface ImageBrowserProps {
  files?: ImageFile[];
  defaultParts?: string[];
  showBreadcrumbs?: boolean;
  onSelect: (mrn: string) => void;
}

function listFiles(data: ImageFile[], parts: string[], all = false) {
  const files: ImageFile[] = [];

  for (const file of data) {
    const fileParts = file.parts ?? [];
    if (!all && parts.length !== fileParts.length) {
      continue;
    }

    if (!arrayStartsWith(fileParts, parts)) {
      continue;
    }

    files.push(file);
  }

  return files;
}

function listDirectories(data: ImageFile[], parts: string[]) {
  const set = new Set<string>();

  for (const file of data) {
    const fileParts = file.parts ?? [];
    if (
      fileParts.length !== parts.length + 1 ||
      !arrayStartsWith(fileParts, parts)
    ) {
      continue;
    }

    const first = fileParts[parts.length];
    if (first) {
      set.add(first);
    }
  }

  return [...set];
}

export const ImageBrowser: React.FC<ImageBrowserProps> = ({
  onSelect,
  defaultParts = [],
  files = [],
  showBreadcrumbs,
}) => {
  const [parts, setParts] = useState<string[]>(defaultParts);

  const images = listFiles(files, parts);
  const directories = listDirectories(files, parts);

  return (
    <div className={styles.images}>
      {showBreadcrumbs && (
        <div className={styles.header}>
          <Breadcrumbs value={parts} onChange={setParts} />
          {IS_ELECTRON && images[0] && (
            <IconButton
              title="Reveal in explorer"
              onClick={() => {
                API.electron.shell.showItemInFolder.mutate(images[0].mrn);
              }}
            >
              <BsFolderFill />
            </IconButton>
          )}
        </div>
      )}
      <div className={styles.wrapper}>
        <div className={styles.list}>
          {Object.values(directories).map(name => (
            <div
              key={name}
              className={clsx(styles.file, styles.type)}
              onClick={e => {
                e.stopPropagation();
                setParts(parts => [...parts, name]);
              }}
            >
              <BsFolder />
              <span>{name}</span>
            </div>
          ))}
          {images.map(file => (
            <div
              key={file.name}
              className={clsx(styles.file, {
                [styles.mask]: parts[0] === 'mask',
              })}
              onClick={() => onSelect(file.mrn)}
            >
              <img src={resolveImage(file.mrn, 'thumbnail')} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
