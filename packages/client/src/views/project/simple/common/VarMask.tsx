import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button } from '$components/button';
import { useVarUIValue } from '$components/var/common/VarUIContext';
import { IVarBaseInputProps, VarBase } from '$components/var/VarBase';
import { MaskEditor } from './MaskEditor';
import styles from './VarMask.module.scss';
import { useSimpleProject } from '../../context';

interface IVarMaskProps extends IVarBaseInputProps<string> {
  imagePath: string;
}

export const VarMask = observer(
  ({
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
    const [imageInternalUrl] = useVarUIValue<string | undefined>({
      path: imagePath,
    });
    const [isOpen, setIsOpen] = useState(false);

    const project = useSimpleProject();
    const imageUrl = project.getImageUrl(imageInternalUrl);
    const maskUrl = project.getImageUrl(currentValue);

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
          </div>
        </VarBase>
      </>
    );
  },
);
