import React, { useCallback } from 'react';
import { BsUpload } from 'react-icons/bs';

import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarImage.module.scss';

export interface IVarImageProps extends IVarBaseInputProps<string> {}

/**
 * Image input component. Accepts and provides a blob URL.
 */
export const VarImage = ({
  label,
  path,
  value,
  onChange,
  disabled,
  readOnly,
  className,
  error,
  errorPath,
}: IVarImageProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) {
        return;
      }

      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCurrentValue(url);
    },
    [setCurrentValue],
  );

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
      column
    >
      <div className={styles.image}>
        <div
          className={styles.background}
          style={{
            backgroundImage: currentValue
              ? `url('${currentValue}')`
              : undefined,
          }}
          title="Image preview"
        ></div>
        <BsUpload />
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          title="Image upload"
        />
      </div>
    </VarBase>
  );
};
