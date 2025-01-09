import { Architecture, Model, ModelType } from '@metastable/types';
import { useState } from 'react';
import { BsPlusLg } from 'react-icons/bs';

import { ModelBrowser } from '$components/modelBrowser';
import { Popover } from '$components/popover';
import styles from './VarAddModel.module.scss';
import { VarBase } from './VarBase';

export interface IVarAddModelProps {
  label: string;
  modelType: ModelType | ModelType[];
  architecture?: Architecture;
  onSelect?: (modelData: Model) => void;
  disabled?: boolean;
  className?: string;
}

export const VarAddModel = ({
  label,
  disabled,
  modelType,
  onSelect,
  architecture,
  className,
}: IVarAddModelProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

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
              if (!model) {
                return;
              }

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
};
