import { IVarBaseInputProps, VarBase, useVarUIValue } from 'react-var-ui';
import { ModelType } from '@metastable/types';

import { useUI } from '@components/ui';
import { stringToColor } from '@utils/string';
import { ModelSelect } from '@modals/modelSelect';
import styles from './VarModel.module.scss';
import { useSimpleProject } from '../../../context';
import { mainStore } from '@/stores/MainStore';
import { observer } from 'mobx-react-lite';
import { getStaticUrl } from '@/common/utils/url';
import { BsChevronRight } from 'react-icons/bs';

interface IVarModelProps extends IVarBaseInputProps<string> {
  modelType: ModelType;
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
  }: IVarModelProps): JSX.Element => {
    const { showModal } = useUI();
    const project = useSimpleProject();
    const [currentValue, setCurrentValue, currentError] = useVarUIValue({
      path,
      fallbackValue: value,
      onChange,
      error,
      errorPath,
    });

    const model = currentValue
      ? mainStore.info.models[modelType]?.find(
          model => model.file.name === currentValue,
        )
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
                  type={modelType}
                  onSelect={model => {
                    setCurrentValue(model.file.name);

                    if (model.samplerSettings) {
                      project.settings.sampler = {
                        ...project.settings.sampler,
                        ...model.samplerSettings,
                      };
                    }
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
                  {model.image && (
                    <img
                      src={getStaticUrl(
                        `/models/${modelType}/.metastable/${model.image}`,
                      )}
                    />
                  )}
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
