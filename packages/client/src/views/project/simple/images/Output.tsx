import { ImageFile, ProjectFileType } from '@metastable/types';
import React from 'react';

import { ImagePreview } from '$components/imagePreview';
import { resolveImage } from '$utils/url';
import styles from './Output.module.scss';
import { ImageActions } from '../common/ImageActions';

interface OutputProps {
  output: ImageFile;
}

export const Output: React.FC<OutputProps> = ({ output }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.imageActions}>
        <div>{output.name}</div>
        <div className={styles.buttons}>
          <ImageActions file={output} type={ProjectFileType.OUTPUT} />
        </div>
      </div>
      <ImagePreview className={styles.image} url={resolveImage(output.mrn)} />
    </div>
  );
};
