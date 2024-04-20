import { Switch, SwitchOptionDetails } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

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
      <Switch value={currentValue} onChange={setCurrentValue}>
        <SwitchOptionDetails value="stretch" name="Stretch" />
        <SwitchOptionDetails value="center" name="Center" />
        <SwitchOptionDetails value="cover" name="Cover" />
        <SwitchOptionDetails value="contain" name="Contain" />
      </Switch>
    </VarBase>
  );
};
