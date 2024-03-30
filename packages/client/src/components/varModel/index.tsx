import { Model, ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import { BsChevronRight } from 'react-icons/bs';
import { IVarBaseInputProps, useVarUIValue, VarBase } from 'react-var-ui';

import { useUI } from '$components/ui';
import { ModelSelect } from '$modals/modelSelect';
import { modelStore } from '$stores/ModelStore';
import { stringToColor } from '$utils/string';
import styles from './index.module.scss';

interface IVarModelProps extends IVarBaseInputProps<string> {
  modelType: ModelType;
  onSelect?: (modelData: Model) => void;
}

export const VarModel = observer(
  ({
    path,
    value,
    onChange,
    disabled,
    readOnly,
    className,
    error,
    errorPath,
    modelType,
    onSelect,
  }: IVarModelProps): JSX.Element => {
    const { showModal } = useUI();
    const [currentValue, setCurrentValue, currentError] = useVarUIValue({
      path,
      fallbackValue: value,
      onChange,
      error,
      errorPath,
    });

    const model = currentValue
      ? modelStore.find(modelType, currentValue)
      : undefined;

    return (
      <VarBase
        label="Model"
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        error={currentError}
      >
        <span className="react-var-ui-button">
          <button
            className={styles.selection}
            onClick={() => {
              showModal(
                <ModelSelect
                  value={model}
                  type={modelType}
                  onSelect={model => {
                    setCurrentValue(model.file.name);
                    onSelect?.(model);
                  }}
                />,
              );
            }}
          >
            {model ? (
              <>
                <div
                  style={{ backgroundColor: stringToColor(currentValue) }}
                  className={styles.icon}
                >
                  {model.image && <img src={model.image.thumbnailUrl} />}
                </div>
                <span className={styles.name}>{model.name}</span>
                <div className={styles.chevron}>
                  <BsChevronRight />
                </div>
              </>
            ) : (
              <>
                <span className={styles.name}>(none)</span>
                <div className={styles.chevron}>
                  <BsChevronRight />
                </div>
              </>
            )}
          </button>
        </span>
      </VarBase>
    );
  },
);
