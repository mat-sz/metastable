import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { BsChevronDown, BsPalette, BsXLg } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { TreeBrowser } from '$components/treeBrowser';
import { VarBase } from '$components/var';
import { PROMPT_STYLE_NONE_ID } from '$data/styles';
import { usePopover } from '$hooks/usePopover';
import { mainStore } from '$stores/MainStore';
import styles from './StyleSelect.module.scss';
import { useSimpleProject } from '../../context';

interface Props {
  className?: string;
}

export const StyleSelect: React.FC<Props> = observer(({ className }) => {
  const project = useSimpleProject();

  const availableStyles = [...project.availableStyles];
  const currentStyle = project.settings.prompt.style;

  const { popover, onClick, hide } = usePopover(
    <TreeBrowser
      small
      view="list"
      showBreadcrumbs
      onSelect={item => {
        hide();
        runInAction(() => {
          if (!item?.id || item.id === PROMPT_STYLE_NONE_ID) {
            project.settings.prompt.style = undefined;
          } else {
            project.settings.prompt.style = { ...item };
          }
        });
      }}
      nodes={availableStyles}
      getCardProps={item => ({
        name: item.name,
        icon: <BsPalette />,
      })}
      actions={
        <IconButton
          title="Reset"
          onClick={() => {
            hide();
            runInAction(() => {
              project.settings.prompt.style = undefined;
            });
          }}
        >
          <BsXLg />
        </IconButton>
      }
      quickFilter={(nodes, search) =>
        mainStore.searchFn(nodes, search, item => item?.name ?? 'None')
      }
    />,
  );

  return (
    <VarBase className={className}>
      <button className={styles.selection} onClick={onClick}>
        <span className={styles.name}>{currentStyle?.name || 'No style'}</span>
        <div className={styles.chevron}>
          <BsChevronDown />
        </div>
      </button>
      {popover}
    </VarBase>
  );
});
