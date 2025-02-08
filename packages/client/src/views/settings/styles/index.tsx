import { Architecture } from '@metastable/types';
import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import React from 'react';
import { BsPencil, BsTrash } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { TabPanel } from '$components/tabs';
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
  parentId?: string;
  label?: string;
}

const SettingsStylesFolder: React.FC<SettingsStylesFolderProps> = observer(
  ({ parentId, label = 'All styles' }) => {
    const currentStyles =
      mainStore.config.data?.styles.filter(
        item => item.parentId === parentId,
      ) || [];
    const groups = currentStyles.filter(item => item.nodeType === 'group');
    const items = currentStyles.filter(item => item.nodeType === 'item');

    return (
      <VarCategory
        label={label}
        className={clsx(styles.group, { [styles.root]: !parentId })}
      >
        {groups.map(group => (
          <SettingsStylesFolder
            key={group.id}
            parentId={group.id}
            label={group.name}
          />
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
                onClick={() => {
                  mainStore.config.data!.styles.push({
                    id: nanoid(),
                    name: 'New group',
                    nodeType: 'group',
                  });
                  mainStore.config.save();
                }}
              />
            </div>
          )}
          getEmptyObject={() => ({
            id: nanoid(),
            nodeType: 'item',
            architecture: 'any',
            parentId,
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
      <SettingsStylesFolder />
    </TabPanel>
  );
});
