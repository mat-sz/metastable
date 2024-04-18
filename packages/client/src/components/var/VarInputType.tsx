import { BsAsterisk, BsImage, BsMask } from 'react-icons/bs';

import { Switch, SwitchOption } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarInputType.module.scss';

export interface IVarInputTypeProps extends IVarBaseInputProps<string> {}

export const VarInputType = ({
  path,
  onChange,
  label,
}: IVarInputTypeProps): JSX.Element => {
  const [currentValue, setCurrentValue] = useVarUIValue({
    path,
    onChange,
    fallbackValue: 'stretch',
  });

  return (
    <VarBase label={label}>
      <div className={styles.wrapper}>
        <Switch
          value={currentValue}
          onChange={setCurrentValue}
          className={styles.switch}
        >
          <SwitchOption value="none">
            <BsAsterisk />
            <span>None</span>
            <span className={styles.details}>Generate a new image</span>
          </SwitchOption>
          <SwitchOption value="image">
            <BsImage />
            <span>img2img</span>
            <span className={styles.details}>Use an image as an input</span>
          </SwitchOption>
          <SwitchOption value="image_masked">
            <BsMask />
            <span>Inpainting</span>
            <span className={styles.details}>
              Use an image and a mask as an input
            </span>
          </SwitchOption>
        </Switch>
      </div>
    </VarBase>
  );
};
