import { Switch, SwitchOption } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';
import styles from './VarImageMode.module.scss';

export interface IVarImageModeProps extends IVarBaseInputProps<string> {}

export const VarImageMode = ({
  path,
  onChange,
  label,
}: IVarImageModeProps): JSX.Element => {
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
          <SwitchOption value="stretch">
            <span>Stretch</span>
          </SwitchOption>
          <SwitchOption value="center">
            <span>Center</span>
          </SwitchOption>
          <SwitchOption value="cover">
            <span>Cover</span>
          </SwitchOption>
          <SwitchOption value="contain">
            <span>Contain</span>
          </SwitchOption>
        </Switch>
      </div>
    </VarBase>
  );
};
