import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { BsChevronDown, BsXLg } from 'react-icons/bs';
import { Popover } from 'react-tiny-popover';

import { IconButton } from '$components/iconButton';
import { TreeBrowser } from '$components/treeBrowser';
import { getItemsFactory, listItems } from '$components/treeBrowser/helpers';
import { TreeBrowserItem } from '$components/treeBrowser/types';
import { VarBase } from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './StyleSelect.module.scss';
import { useSimpleProject } from '../../context';

interface Props {
  className?: string;
}

export const StyleSelect: React.FC<Props> = observer(({ className }) => {
  const project = useSimpleProject();
  const [isOpen, setIsOpen] = useState(false);

  const availableStyles = [undefined, ...project.availableStyles];
  const currentStyle = project.settings.prompt.style;

  return (
    <VarBase label="Prompt style" className={className}>
      <Popover
        isOpen={isOpen}
        positions={['bottom', 'left', 'right', 'top']}
        containerStyle={{ zIndex: '10' }}
        onClickOutside={() => setIsOpen(false)}
        content={
          <TreeBrowser
            small
            view="details"
            showBreadcrumbs
            onSelect={item => {
              setIsOpen(false);
              runInAction(() => {
                project.settings.prompt.style = item?.data;
              });
            }}
            getItems={getItemsFactory(
              availableStyles,
              style => style?.id || '_none',
              style => style?.parts,
            )}
            getCardProps={item => {
              return {
                name: item.data?.name || 'None',
              };
            }}
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
            quickFilter={(_: any, parts: string[], search) =>
              mainStore
                .searchFn(
                  listItems(
                    availableStyles,
                    style => style?.parts,
                    parts,
                    true,
                  ),
                  search,
                  item => item?.name ?? 'None',
                )
                .map(item => {
                  return {
                    id: item?.id || '_none',
                    type: 'item',
                    data: item,
                  } as TreeBrowserItem<any>;
                })
            }
          />
        }
      >
        <button
          className={styles.selection}
          onClick={() => setIsOpen(current => !current)}
        >
          <span className={styles.name}>
            {currentStyle?.name || 'Select style'}
          </span>
          <div className={styles.chevron}>
            <BsChevronDown />
          </div>
        </button>
      </Popover>
    </VarBase>
  );
});
