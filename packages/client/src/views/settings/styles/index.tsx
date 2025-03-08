import { Architecture } from '@metastable/types';
import clsx from 'clsx';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { BsPencil, BsTrash } from 'react-icons/bs';

import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { Modal, ModalActions } from '$components/modal';
import { TabPanel } from '$components/tabs';
import { getDescendants } from '$components/treeBrowser/helpers';
import {
  VarArrayWithModal,
  VarButton,
  VarCategory,
  VarPrompt,
  VarSelect,
  VarString,
} from '$components/var';
import { useModalWrapperContext } from '$hooks/useModal';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

const MAPPED_ARCHITECTURES = Object.entries(Architecture).map(
  ([label, value]) => ({ key: value, label, value }),
);

interface SettingsStylesFolderProps {
  parentId?: string;
  parentName?: string;
}

interface GroupModalProps {
  isEdit?: boolean;
  name?: string;
  onSave: (newName: string) => void;
}

const GroupModal = ({ isEdit, name = '', onSave }: GroupModalProps) => {
  const [current, setCurrent] = useState(name);

  return (
    <Modal
      title={isEdit ? 'Update group' : 'Add group'}
      size="small"
      onSubmit={() => onSave(current)}
    >
      <VarString label="Name" value={current} onChange={setCurrent} />
      <ModalActions>
        <Button variant="primary">{isEdit ? 'Save' : 'Add'}</Button>
      </ModalActions>
    </Modal>
  );
};

const SettingsStylesFolder: React.FC<SettingsStylesFolderProps> = observer(
  ({ parentId, parentName }) => {
    const allStyles = mainStore.config.data?.styles || [];
    const currentStyles = allStyles.filter(item => item.parentId === parentId);
    const groups = currentStyles.filter(item => item.nodeType === 'group');
    const items = currentStyles.filter(item => item.nodeType === 'item');
    const modalWrapper = useModalWrapperContext();

    return (
      <VarCategory
        label={
          <>
            {parentName ?? 'All styles'}
            {!!parentId && (
              <div className={styles.actions}>
                <IconButton
                  onClick={() => {
                    modalWrapper.open(
                      <GroupModal
                        isEdit
                        name={parentName}
                        onSave={name => {
                          mainStore.config.data!.styles =
                            mainStore.config.data!.styles.map(item =>
                              item.id === parentId ? { ...item, name } : item,
                            );
                          mainStore.config.save();
                        }}
                      />,
                    );
                  }}
                >
                  <BsPencil />
                </IconButton>
                <IconButton
                  onClick={() => {
                    const removeIds = [
                      parentId,
                      ...getDescendants(allStyles, parentId).map(
                        item => item.id,
                      ),
                    ];
                    mainStore.config.data!.styles =
                      mainStore.config.data!.styles.filter(
                        item => !removeIds.includes(item.id),
                      );
                  }}
                >
                  <BsTrash />
                </IconButton>
              </div>
            )}
          </>
        }
        className={clsx(styles.group, { [styles.root]: !parentId })}
      >
        {groups.map(group => (
          <SettingsStylesFolder
            key={group.id}
            parentId={group.id}
            parentName={group.name}
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
                  modalWrapper.open(
                    <GroupModal
                      onSave={name => {
                        mainStore.config.data!.styles.push({
                          id: nanoid(),
                          name,
                          nodeType: 'group',
                          parentId,
                        });
                        mainStore.config.save();
                      }}
                    />,
                  );
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
