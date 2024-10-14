import { BsPencil, BsRecordFill, BsXLg } from 'react-icons/bs';

import { Hotkey } from '$components/hotkey';
import { IconButton } from '$components/iconButton';
import { useRecord } from '$hooks/useHotkey';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarHotkey.module.scss';

export const VarHotkey = ({
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

  const { start, stop, isRecording } = useRecord(setCurrentValue);

  return (
    <VarBase
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      error={currentError}
    >
      <div className={styles.wrapper}>
        {isRecording ? (
          <div className={styles.recording}>
            <BsRecordFill />
            <span>Recording...</span>
          </div>
        ) : (
          <Hotkey keys={currentValue} />
        )}
        <IconButton
          onClick={() => {
            if (!isRecording) {
              start();
            } else {
              stop();
            }
          }}
          title={isRecording ? 'Cancel' : 'Record'}
        >
          {isRecording ? <BsXLg /> : <BsPencil />}
        </IconButton>
        {!isRecording && !!currentValue && (
          <IconButton
            onClick={() => {
              setCurrentValue('');
            }}
            title="Unset"
          >
            <BsXLg />
          </IconButton>
        )}
      </div>
    </VarBase>
  );
};
