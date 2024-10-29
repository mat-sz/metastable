import { ProjectFileType } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsFolder, BsFolderFill } from 'react-icons/bs';

import { API } from '$api';
import { Breadcrumbs } from '$components/breadcrumbs';
import { IconButton } from '$components/iconButton';
import { IS_ELECTRON } from '$utils/config';
import { TYPE_MAP } from '$utils/image';
import { resolveImage } from '$utils/url';
import styles from './ImageBrowser.module.scss';
import { useSimpleProject } from '../../context';

interface Props {
  defaultType?: ProjectFileType;
  forceType?: ProjectFileType;
  onSelect: (url: string) => void;
}

export const ImageBrowser: React.FC<Props> = observer(
  ({ onSelect, forceType, defaultType = ProjectFileType.INPUT }) => {
    const [type, setType] = useState<ProjectFileType | undefined>(
      forceType ?? defaultType,
    );

    const project = useSimpleProject();
    const images = type ? project.files[type] : [];

    return (
      <div className={styles.images}>
        {!forceType && (
          <div className={styles.header}>
            <Breadcrumbs
              value={type ? [type] : []}
              onChange={value => {
                setType(value[0] as any);
              }}
            />
            {IS_ELECTRON && images[0] && (
              <IconButton
                title="Reveal in explorer"
                onClick={() => {
                  API.electron.shell.showItemInFolder.mutate(images[0].path);
                }}
              >
                <BsFolderFill />
              </IconButton>
            )}
          </div>
        )}
        <div className={styles.wrapper}>
          <div className={styles.list}>
            {!type &&
              Object.values(ProjectFileType).map(type => (
                <div
                  key={type}
                  className={clsx(styles.file, styles.type)}
                  onClick={e => {
                    e.stopPropagation();
                    setType(type);
                  }}
                >
                  <BsFolder />
                  <span>{TYPE_MAP[type]}</span>
                </div>
              ))}
            {images.map(file => (
              <div
                key={file.name}
                className={clsx(styles.file, {
                  [styles.mask]: type === ProjectFileType.MASK,
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
  },
);
