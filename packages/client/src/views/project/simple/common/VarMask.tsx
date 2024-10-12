import { ProjectFileType } from '@metastable/types';
import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '$components/button';
import { useVarUIValue } from '$components/var/common/VarUIContext';
import { IVarBaseInputProps, VarBase } from '$components/var/VarBase';
import { resolveImage } from '$utils/url';
import { ImageBrowseButton } from './ImageBrowseButton';
import { MaskEditor } from './MaskEditor';
import styles from './VarMask.module.scss';

interface IVarMaskProps extends IVarBaseInputProps<string> {
  imagePath: string;
}

export const VarMask = ({
  path,
  imagePath,
  value,
  onChange,
  readOnly,
  className,
  error,
  errorPath,
  label = 'Mask',
}: IVarMaskProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });
  const [imageMrn] = useVarUIValue<string | undefined>({
    path: imagePath,
  });
  const [isOpen, setIsOpen] = useState(false);

  const imageUrl = resolveImage(imageMrn);
  const maskUrl = resolveImage(currentValue);

  return (
    <>
      {isOpen && !!imageUrl && (
        <MaskEditor
          imageSrc={imageUrl}
          maskSrc={maskUrl}
          onClose={mask => {
            setIsOpen(false);
            if (mask) {
              setCurrentValue(mask);
            }
          }}
        />
      )}
      <VarBase
        label={label}
        disabled={!imageUrl}
        readOnly={readOnly}
        className={clsx(className, styles.mask)}
        error={currentError}
      >
        <div className={styles.actions}>
          <Button onClick={() => setIsOpen(true)}>Edit mask</Button>
          <ImageBrowseButton
            onSelect={url => setCurrentValue(url)}
            forceType={ProjectFileType.MASK}
          />
        </div>
      </VarBase>
    </>
  );
};
