import clsx from 'clsx';
import { BsLink } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { Number } from './common/Number';
import { roundValue } from './common/roundValue';
import { useVarUIValue } from './common/VarUIContext';
import { VarBase } from './VarBase';
import styles from './VarSize.module.scss';

export interface IVarSizeProps {
  widthPath: string;
  heightPath: string;
  lockedPath: string;
  label?: string;
}

const round = (value: number) => roundValue(value, 64, 2048, 8, true);

export const VarSize = ({
  widthPath,
  heightPath,
  lockedPath,
  label = 'Size',
}: IVarSizeProps): JSX.Element => {
  const [width, setWidth] = useVarUIValue({
    path: widthPath,
    fallbackValue: 512,
  });
  const [height, setHeight] = useVarUIValue({
    path: heightPath,
    fallbackValue: 512,
  });
  const [isLocked, setIsLocked] = useVarUIValue({
    path: lockedPath,
    fallbackValue: false,
  });

  return (
    <VarBase label={label} inline>
      <div className={styles.size}>
        <Number
          min={64}
          max={2048}
          step={8}
          round={round}
          unit="px"
          value={width}
          className={styles.input}
          onChange={value => {
            if (isLocked) {
              const newHeight = (height / width) * value;
              setHeight(round(newHeight));
            }

            setWidth(value);
          }}
        />
        <IconButton
          onClick={() => setIsLocked(!isLocked)}
          className={clsx({ [styles.active]: isLocked })}
        >
          <BsLink />
        </IconButton>
        <Number
          min={64}
          max={2048}
          step={8}
          round={round}
          unit="px"
          value={height}
          className={styles.input}
          onChange={value => {
            if (isLocked) {
              const newWidth = (width / height) * value;
              setWidth(round(newWidth));
            }

            setHeight(value);
          }}
        />
      </div>
    </VarBase>
  );
};
