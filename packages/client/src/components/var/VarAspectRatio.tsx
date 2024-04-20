import { MdCropLandscape, MdCropPortrait, MdCropSquare } from 'react-icons/md';

import { Switch, SwitchOptionDetails } from '$components/switch';
import { useVarUIValue } from './common/VarUIContext';
import { VarBase } from './VarBase';

export interface IVarAspectRatioProps {
  widthPath?: string;
  heightPath?: string;
  label?: string;
}

export const VarAspectRatio = ({
  widthPath,
  heightPath,
  label,
}: IVarAspectRatioProps): JSX.Element => {
  const [width, setWidth] = useVarUIValue({
    path: widthPath,
    fallbackValue: 512,
  });
  const [height, setHeight] = useVarUIValue({
    path: heightPath,
    fallbackValue: 512,
  });

  const orientation =
    height === width ? 'square' : height > width ? 'portrait' : 'landscape';

  const squareWidth = Math.min(width, height);

  let portraitWidth = width;
  let portraitHeight = height;

  let landscapeWidth = width;
  let landscapeHeight = height;

  switch (orientation) {
    case 'square':
      {
        const other = Math.floor((squareWidth * 1.5) / 8) * 8;
        portraitHeight = other;
        landscapeWidth = other;
      }
      break;
    case 'portrait':
      landscapeWidth = height;
      landscapeHeight = width;
      break;
    case 'landscape':
      portraitWidth = height;
      portraitHeight = width;
      break;
  }

  return (
    <VarBase label={label}>
      <Switch
        value={orientation}
        onChange={value => {
          switch (value) {
            case 'square':
              setWidth(squareWidth);
              setHeight(squareWidth);
              break;
            case 'portrait':
              setWidth(portraitWidth);
              setHeight(portraitHeight);
              break;
            case 'landscape':
              setWidth(landscapeWidth);
              setHeight(landscapeHeight);
              break;
          }
        }}
      >
        <SwitchOptionDetails
          value="square"
          icon={<MdCropSquare />}
          name="Square"
          description={`${squareWidth} x ${squareWidth}`}
        />
        <SwitchOptionDetails
          value="portrait"
          icon={<MdCropPortrait />}
          name="Portrait"
          description={`${portraitWidth} x ${portraitHeight}`}
        />
        <SwitchOptionDetails
          value="landscape"
          icon={<MdCropLandscape />}
          name="Landscape"
          description={`${landscapeWidth} x ${landscapeHeight}`}
        />
      </Switch>
    </VarBase>
  );
};
