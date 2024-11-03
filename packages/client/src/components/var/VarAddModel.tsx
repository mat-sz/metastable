import { Architecture, Model, ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BsBox, BsPlusLg } from 'react-icons/bs';
import { Popover } from 'react-tiny-popover';

import { ModelBrowser } from '$components/modelBrowser';
import { mainStore } from '$stores/MainStore';
import { uiStore } from '$stores/UIStore';
import styles from './VarAddModel.module.scss';
import { VarBase } from './VarBase';

export interface IVarAddModelProps {
  label: string;
  modelType: ModelType;
  architecture?: Architecture;
  onSelect?: (modelData: Model) => void;
  disabled?: boolean;
  className?: string;
}

export const VarAddModel = observer(
  ({
    label,
    disabled,
    modelType,
    onSelect,
    architecture,
    className,
  }: IVarAddModelProps): JSX.Element => {
    const [isOpen, setIsOpen] = useState(false);
    const defaultModel = mainStore.defaultModelMrn(modelType);

    if (!defaultModel) {
      return (
        <VarBase disabled={disabled} className={className}>
          <button
            className={styles.selection}
            onClick={() => uiStore.setView('models')}
          >
            <BsBox />
            <span>Download models</span>
          </button>
        </VarBase>
      );
    }

    return (
      <VarBase disabled={disabled} className={className}>
        <Popover
          isOpen={isOpen}
          positions={['bottom', 'left', 'right', 'top']}
          containerStyle={{ zIndex: '10' }}
          onClickOutside={() => setIsOpen(false)}
          content={
            <ModelBrowser
              variant="small"
              type={modelType}
              architecture={architecture}
              onSelect={model => {
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
            <BsPlusLg />
            <span>Add {label}</span>
          </button>
        </Popover>
      </VarBase>
    );
  },
);
