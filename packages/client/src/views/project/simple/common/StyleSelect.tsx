import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BsChevronDown, BsPalette, BsXLg } from 'react-icons/bs';
import { Popover } from 'react-tiny-popover';

import { IconButton } from '$components/iconButton';
import { TreeBrowser } from '$components/treeBrowser';
import { VarBase } from '$components/var';
import { PROMPT_STYLE_NONE_ID } from '$data/styles';
import { mainStore } from '$stores/MainStore';
import styles from './StyleSelect.module.scss';
import { useSimpleProject } from '../../context';

interface Props {
  className?: string;
}

export const StyleSelect: React.FC<Props> = observer(({ className }) => {
  const project = useSimpleProject();
  const [isOpen, setIsOpen] = useState(false);

  const availableStyles = [...project.availableStyles];
  const currentStyle = project.settings.prompt.style;

  return (
    <VarBase className={className}>
      <Popover
        isOpen={isOpen}
        positions={['bottom', 'left', 'right', 'top']}
        containerStyle={{ zIndex: '10' }}
        onClickOutside={() => setIsOpen(false)}
        content={
          <TreeBrowser
            small
            view="list"
            showBreadcrumbs
            onSelect={item => {
              setIsOpen(false);
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
                  setIsOpen(false);
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
          />
        }
      >
        <button
          className={styles.selection}
          onClick={() => setIsOpen(current => !current)}
        >
          <span className={styles.name}>
            {currentStyle?.name || 'No style'}
          </span>
          <div className={styles.chevron}>
            <BsChevronDown />
          </div>
        </button>
      </Popover>
    </VarBase>
  );
});
