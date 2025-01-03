import { Architecture, Model, ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';

import { ModelBrowser } from '$components/modelBrowser';
import { Popover } from '$components/popover';
import { modelStore } from '$stores/ModelStore';
import { stringToColor } from '$utils/string';
import { resolveImage } from '$utils/url';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarModel.module.scss';

export interface IVarModelProps extends IVarBaseInputProps<string> {
  modelType: ModelType;
  architecture?: Architecture;
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
    label = 'Model',
    architecture,
  }: IVarModelProps): JSX.Element => {
    const [currentValue, setCurrentValue, currentError] = useVarUIValue({
      path,
      fallbackValue: value,
      onChange,
      error,
      errorPath,
    });
    const [isOpen, setIsOpen] = useState(false);

    const model = currentValue ? modelStore.find(currentValue) : undefined;

    return (
      <VarBase
        label={label}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        error={currentError}
      >
        <Popover
          isOpen={isOpen}
          positions={['bottom', 'left', 'right', 'top']}
          containerStyle={{ zIndex: '10' }}
          onClickOutside={() => setIsOpen(false)}
          content={
            <ModelBrowser
              variant="small"
              defaultParts={model?.file.parts}
              type={modelType}
              architecture={architecture}
              onSelect={model => {
                setCurrentValue(model.mrn);
                onSelect?.(model);
                setIsOpen(false);
              }}
            />
          }
        >
          <button
            className={styles.selection}
            onClick={() => setIsOpen(current => !current)}
          >
            {model ? (
              <>
                <div
                  style={{ backgroundColor: stringToColor(currentValue) }}
                  className={styles.icon}
                >
                  {model.coverMrn && (
                    <img src={resolveImage(model.coverMrn, 'thumbnail')} />
                  )}
                </div>
                <span className={styles.name}>{model.name}</span>
              </>
            ) : (
              <>
                <span className={styles.name}>(none)</span>
              </>
            )}
            <div className={styles.chevron}>
              <BsChevronDown />
            </div>
          </button>
        </Popover>
      </VarBase>
    );
  },
);
