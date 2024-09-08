import { Switch, SwitchOptionDetails } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

export const VarImageMode = ({
  path,
  onChange,
  label,
}: IVarBaseInputProps<string>): JSX.Element => {
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
