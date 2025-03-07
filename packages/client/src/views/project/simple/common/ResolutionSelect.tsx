import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { BsChevronDown } from 'react-icons/bs';

import { recommendedResolutions } from '$data/resolutions';
import { usePopover } from '$hooks/usePopover';
import styles from './ResolutionSelect.module.scss';
import { useSimpleProject } from '../../context';

export const ResolutionSelect: React.FC = observer(() => {
  const project = useSimpleProject();
  const architecture = project.architecture!;
  const { height, width } = project.settings.output;

  const orientation =
    height === width ? 'square' : height > width ? 'portrait' : 'landscape';

  const resolutions = recommendedResolutions[architecture]?.[orientation];
  const { popover, onClick, hide } = usePopover(
    <div className={styles.select}>
      {resolutions?.map((res, i) => (
        <button
          key={i}
          onClick={() => {
            hide();
            runInAction(() => {
              project.settings.output.width = res[0];
              project.settings.output.height = res[1];
            });
          }}
        >
          {res[0]}px x {res[1]}px
        </button>
      ))}
    </div>,
  );

  if (!resolutions?.length) {
    return null;
  }

  return (
    <div className={styles.label}>
      <button className={styles.selection} onClick={onClick}>
        <span className={styles.name}>Recommended resolutions</span>
        <div className={styles.chevron}>
          <BsChevronDown />
        </div>
      </button>
      {popover}
    </div>
  );
});
