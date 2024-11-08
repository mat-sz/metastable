import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '$components/button';
import { ImageBrowseButton } from '$components/imageBrowser';
import { ImageBrowserProps } from '$components/imageBrowser/ImageBrowser';
import { MaskEditor } from '$components/maskEditor';
import { useVarUIValue } from '$components/var/common/VarUIContext';
import { IVarBaseInputProps, VarBase } from '$components/var/VarBase';
import { resolveImage } from '$utils/url';
import styles from './VarMask.module.scss';

interface IVarMaskProps extends IVarBaseInputProps<string> {
  imagePath: string;
  imageBrowserProps?: Omit<ImageBrowserProps, 'onSelect'>;
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
  imageBrowserProps,
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
          {!!imageBrowserProps && (
            <ImageBrowseButton
              onSelect={url => setCurrentValue(url)}
              {...imageBrowserProps}
            />
          )}
        </div>
      </VarBase>
    </>
  );
};
