import { useCallback } from 'react';
import { BsUpload } from 'react-icons/bs';

import { ImageBrowseButton } from '$components/imageBrowser';
import { ImageBrowserProps } from '$components/imageBrowser/ImageBrowser';
import { resolveImage } from '$utils/url';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarImage.module.scss';

function filterItems(items: DataTransferItemList) {
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      return item;
    }
  }

  return undefined;
}

export interface IVarImageProps extends IVarBaseInputProps<string | undefined> {
  imageBrowserProps?: Omit<ImageBrowserProps, 'onSelect'>;
}

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
  imageBrowserProps,
}: IVarImageProps): JSX.Element => {
  const [currentValue, setCurrentValue, currentError] = useVarUIValue<
    string | undefined
  >({
    path,
    fallbackValue: value,
    onChange,
    error,
    errorPath,
  });

  const onFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setCurrentValue(url);
    },
    [setCurrentValue],
  );

  return (
    <VarBase
      label={
        <div className={styles.header}>
          <span>{label}</span>
          {!!imageBrowserProps && (
            <ImageBrowseButton
              onSelect={url => setCurrentValue(url)}
              {...imageBrowserProps}
            />
          )}
        </div>
      }
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
            backgroundImage: currentValue
              ? `url('${resolveImage(currentValue, 'thumbnail')}')`
              : undefined,
          }}
          title="Image preview"
        ></div>
        <BsUpload />
        <input
          type="file"
          accept="image/*"
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
};
