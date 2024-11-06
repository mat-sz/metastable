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
  const [editorState, setEditorState] = useState<{
    imageSrc: string;
    maskSrc?: string;
  }>();

  const imageSrc = resolveImage(imageMrn);

  return (
    <>
      {!!editorState && (
        <MaskEditor
          {...editorState}
          onClose={mask => {
            setEditorState(undefined);
            if (mask) {
              setCurrentValue(mask);
            }
          }}
        />
      )}
      <VarBase
        label={label}
        disabled={!imageSrc}
        readOnly={readOnly}
        className={clsx(className, styles.mask)}
        error={currentError}
      >
        <div className={styles.actions}>
          <Button
            onClick={() =>
              setEditorState({
                imageSrc,
                maskSrc: resolveImage(currentValue),
              })
            }
          >
            Edit mask
          </Button>
          <ImageBrowseButton
            onSelect={url => setCurrentValue(url)}
            forceType={ProjectFileType.MASK}
          />
        </div>
      </VarBase>
    </>
  );
};
