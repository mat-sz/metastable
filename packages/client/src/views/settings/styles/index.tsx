import { Architecture } from '@metastable/types';
import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { BsPencil, BsTrash } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { TabPanel } from '$components/tabs';
import { listGroups, listItems } from '$components/treeBrowser/helpers';
import {
  VarArrayWithModal,
  VarButton,
  VarCategory,
  VarPrompt,
  VarSelect,
  VarString,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

const MAPPED_ARCHITECTURES = Object.entries(Architecture).map(
  ([label, value]) => ({ key: value, label, value }),
);

interface SettingsStylesFolderProps {
  parts: string[];
}

const SettingsStylesFolder: React.FC<SettingsStylesFolderProps> = observer(
  ({ parts }) => {
    const allStyles = mainStore.config.data?.styles || [];
    const [tempGroups, setTempGroups] = useState<string[]>([]);

    const groups = [
      ...new Set([
        ...listGroups(allStyles, item => item.parts, parts),
        ...tempGroups,
      ]),
    ];
    const items = listItems(allStyles, item => item.parts, parts);

    return (
      <VarCategory
        label={parts[parts.length - 1] ?? 'All styles'}
        className={clsx(styles.group, { [styles.root]: parts.length === 0 })}
      >
        {groups.map(group => (
          <SettingsStylesFolder key={group} parts={[...parts, group]} />
        ))}
        <VarArrayWithModal
          addModalTitle="Add prompt style"
          editModalTitle="Edit prompt style"
          value={items}
          onAdd={item => {
            runInAction(() => {
              mainStore.config.data!.styles.push(item);
              mainStore.config.save();
            });
          }}
          onUpdate={(item, index) => {
            runInAction(() => {
              mainStore.config.data!.styles[index] = item;
              mainStore.config.save();
            });
          }}
          onRemove={(_, index) => {
            runInAction(() => {
              mainStore.config.data!.styles.splice(index, 1);
              mainStore.config.save();
            });
          }}
          footer={({ add }) => (
            <div className={styles.actions}>
              <VarButton buttonLabel="Add style" onClick={add} />
              <VarButton
                buttonLabel="Add group"
                onClick={() => setTempGroups(groups => [...groups, nanoid()])}
              />
            </div>
          )}
          getEmptyObject={() => ({
            id: nanoid(),
            architecture: 'any',
            parts: [...parts],
          })}
          modalChildren={
            <>
              <VarCategory label="Style" forceBorder>
                <VarString path="name" label="Name" />
                <VarSelect
                  path="architecture"
                  label="Model architecture"
                  options={[
                    {
                      key: 'any',
                      label: 'Any',
                      value: 'any',
                    },
                    ...MAPPED_ARCHITECTURES,
                  ]}
                />
                <VarPrompt
                  className={styles.prompt}
                  path="positive"
                  label="Positive prompt"
                />
                <VarPrompt
                  className={styles.prompt}
                  path="negative"
                  label="Negative prompt"
                />
              </VarCategory>
              <div className={styles.hint}>
                <strong>Hint:</strong> Use {'{prompt}'} if you'd like for the
                input prompt to be placed inside of the style prompt.
              </div>
            </>
          }
        >
          {({ remove, edit, element }) => (
            <div className={styles.style}>
              <div>{element.name}</div>
              <div className={styles.actions}>
                <IconButton onClick={edit}>
                  <BsPencil />
                </IconButton>
                <IconButton onClick={remove}>
                  <BsTrash />
                </IconButton>
              </div>
            </div>
          )}
        </VarArrayWithModal>
      </VarCategory>
    );
  },
);

export const SettingsStyles: React.FC = observer(() => {
  return (
    <TabPanel id="styles">
      <h2>Prompt styles</h2>
      <SettingsStylesFolder parts={[]} />
    </TabPanel>
  );
});
