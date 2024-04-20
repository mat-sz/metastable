import { BsAsterisk, BsImage, BsMask } from 'react-icons/bs';

import { Switch, SwitchOptionDetails } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

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
      <Switch value={currentValue} onChange={setCurrentValue}>
        <SwitchOptionDetails
          value="none"
          icon={<BsAsterisk />}
          name="None"
          description="Generate a new image"
        />
        <SwitchOptionDetails
          value="image"
          icon={<BsImage />}
          name="img2img"
          description="Use an image as an input"
        />
        <SwitchOptionDetails
          value="image_masked"
          icon={<BsMask />}
          name="Inpainting"
          description="Use an image and a mask as an input"
        />
      </Switch>
    </VarBase>
  );
};
