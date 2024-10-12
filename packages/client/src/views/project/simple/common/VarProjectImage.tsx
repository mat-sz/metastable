import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { BsUpload } from 'react-icons/bs';

import { useVarUIValue } from '$components/var/common/VarUIContext';
import { IVarBaseInputProps, VarBase } from '$components/var/VarBase';
import { ACCEPT_IMAGES } from '$utils/image';
import styles from './VarProjectImage.module.scss';
import { useSimpleProject } from '../../context';

function filterItems(items: DataTransferItemList) {
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item;
    }
  }

  return undefined;
}

export const VarProjectImage = observer(
  ({
    label,
    path,
    value,
    onChange,
    disabled,
    readOnly,
    className,
    error,
    errorPath,
  }: IVarBaseInputProps<string>): JSX.Element => {
    const [currentValue, setCurrentValue, currentError] = useVarUIValue({
      path,
      fallbackValue: value,
      onChange,
      error,
      errorPath,
    });

    const project = useSimpleProject();
    const onFile = useCallback(
      (file: File) => {
        const url = URL.createObjectURL(file);
        setCurrentValue(url);
      },
      [setCurrentValue],
    );

    const previewUrl = project.getImageUrl(currentValue, 'thumbnailUrl');

    return (
      <VarBase
        label={label}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        error={currentError}
        column
      >
        <div
          className={styles.image}
          onDragEnter={e => {
            e.preventDefault();
            e.stopPropagation();

            const item = filterItems(e.dataTransfer.items);
            if (item) {
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();

            const item = filterItems(e.dataTransfer.items);
            const file = item?.getAsFile();
            if (file) {
              onFile(file);
            }
          }}
        >
          <div
            className={styles.background}
            style={{
              backgroundImage: previewUrl ? `url('${previewUrl}')` : undefined,
            }}
            title="Image preview"
          ></div>
          <BsUpload />
          <input
            type="file"
            accept={ACCEPT_IMAGES}
            onChange={e => {
              if (!e.target.files?.length) {
                return;
              }

              onFile(e.target.files[0]);
            }}
            title="Image upload"
          />
        </div>
      </VarBase>
    );
  },
);
