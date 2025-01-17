import { ModelInputType } from '@metastable/types';
import { BsAsterisk, BsImage, BsMask } from 'react-icons/bs';

import { Switch, SwitchOptionDetails } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { IVarBaseInputProps, VarBase } from './VarBase';

interface IVarInputTypeProps extends IVarBaseInputProps<string> {
  supportedTypes: ModelInputType[];
}

export const VarInputType = ({
  path,
  onChange,
  label,
  supportedTypes,
}: IVarInputTypeProps): JSX.Element | undefined => {
  const [currentValue, setCurrentValue] = useVarUIValue({
    path,
    onChange,
    fallbackValue: 'stretch',
  });

  if (supportedTypes.length === 1) {
    return undefined;
  }

  return (
    <VarBase label={label}>
      <Switch value={currentValue} onChange={setCurrentValue}>
        {supportedTypes.includes(ModelInputType.NONE) && (
          <SwitchOptionDetails
            value={ModelInputType.NONE}
            icon={<BsAsterisk />}
            name="None"
            description="Generate a new image"
          />
        )}
        {supportedTypes.includes(ModelInputType.IMAGE) && (
          <SwitchOptionDetails
            value={ModelInputType.IMAGE}
            icon={<BsImage />}
            name="img2img"
            description="Use an image as an input"
          />
        )}
        {supportedTypes.includes(ModelInputType.IMAGE_MASKED) && (
          <SwitchOptionDetails
            value={ModelInputType.IMAGE_MASKED}
            icon={<BsMask />}
            name="Inpainting"
            description="Use an image and a mask as an input"
          />
        )}
      </Switch>
    </VarBase>
  );
};
