import { Architecture, Model, ModelType } from '@metastable/types';
import { BsPlusLg } from 'react-icons/bs';

import { Button } from '$components/button';
import { ModelBrowser } from '$components/modelBrowser';
import { usePopover } from '$hooks/usePopover';
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
  const { popover, onClick, hide } = usePopover(
    <ModelBrowser
      variant="small"
      type={modelType}
      architecture={architecture}
      onSelect={model => {
        if (!model) {
          return;
        }

        onSelect?.(model);
        hide();
      }}
    />,
  );

  return (
    <VarBase disabled={disabled} className={className}>
      <Button
        className={styles.selection}
        onClick={onClick}
        icon={<BsPlusLg />}
      >
        Add {label}
      </Button>
      {popover}
    </VarBase>
  );
};
