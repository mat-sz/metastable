import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { Popover } from 'react-tiny-popover';

import { recommendedResolutions } from '$data/resolutions';
import styles from './ResolutionSelect.module.scss';
import { useSimpleProject } from '../../context';

export const ResolutionSelect: React.FC = observer(() => {
  const [isOpen, setIsOpen] = useState(false);

  const project = useSimpleProject();
  const architecture = project.architecture;
  const { height, width } = project.settings.output;

  const orientation =
    height === width ? 'square' : height > width ? 'portrait' : 'landscape';

  if (!architecture) {
    return null;
  }

  const resolutions = recommendedResolutions[architecture]?.[orientation];
  if (!resolutions?.length) {
    return null;
  }

  return (
    <Popover
      isOpen={isOpen}
      positions={['bottom', 'left', 'right', 'top']}
      containerStyle={{ zIndex: '10' }}
      onClickOutside={() => setIsOpen(false)}
      content={
        <div className={styles.select}>
          {resolutions.map((res, i) => (
            <button
              key={i}
              onClick={() => {
                setIsOpen(false);
                runInAction(() => {
                  project.settings.output.width = res[0];
                  project.settings.output.height = res[1];
                });
              }}
            >
              {res[0]}px x {res[1]}px
            </button>
          ))}
        </div>
      }
    >
      <div className={styles.label}>
        <button
          className={styles.selection}
          onClick={() => setIsOpen(current => !current)}
        >
          <span className={styles.name}>Recommended resolutions</span>
          <div className={styles.chevron}>
            <BsChevronDown />
          </div>
        </button>
      </div>
    </Popover>
  );
});
