import { Architecture, Model, ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import { BsChevronDown } from 'react-icons/bs';

import { ModelBrowser } from '$components/modelBrowser';
import { ThumbnailDisplay } from '$components/thumbnailDisplay';
import { usePopover } from '$hooks/usePopover';
import { modelStore } from '$stores/ModelStore';
import { stringToColor } from '$utils/string';
import { resolveImage } from '$utils/url';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarModel.module.scss';

export interface IVarModelProps extends IVarBaseInputProps<string | undefined> {
  modelType: ModelType | ModelType[];
  architecture?: Architecture;
  onSelect?: (modelData: Model | undefined) => void;
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
    const [currentValue, setCurrentValue, currentError] = useVarUIValue<
      string | undefined
    >({
      path,
      fallbackValue: value,
      onChange,
      error,
      errorPath,
    });
    const model = currentValue ? modelStore.find(currentValue) : undefined;
    const parts = model?.file.parts;

    const { popover, onClick, hide } = usePopover(
      <ModelBrowser
        variant="small"
        defaultParentId={parts?.length ? parts.join('/') : undefined}
        type={modelType}
        architecture={architecture}
        allowReset
        onSelect={model => {
          setCurrentValue(model?.mrn);
          onSelect?.(model);
          hide();
        }}
      />,
    );

    return (
      <VarBase
        label={label}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        error={currentError}
      >
        <button className={styles.selection} onClick={onClick}>
          {model ? (
            <>
              <ThumbnailDisplay
                className={styles.icon}
                color={stringToColor(currentValue)}
                imageUrl={resolveImage(model.coverMrn, 'thumbnail')}
              />
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
        {popover}
      </VarBase>
    );
  },
);
