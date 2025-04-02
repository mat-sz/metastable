import { Architecture } from '@metastable/types';
import clsx from 'clsx';
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
import { useConfigStore } from '$store/config';
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

const SettingsStylesFolder: React.FC<SettingsStylesFolderProps> = ({
  parentId,
  parentName,
}) => {
  const allStyles = useConfigStore(state => state.data?.styles || []);
  const setConfigValue = useConfigStore(state => state.set);

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
                      onSave={name =>
                        setConfigValue(
                          'styles',
                          allStyles.map(item =>
                            item.id === parentId ? { ...item, name } : item,
                          ),
                        )
                      }
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
                    ...getDescendants(allStyles, parentId).map(item => item.id),
                  ];
                  setConfigValue(
                    'styles',
                    allStyles.filter(item => !removeIds.includes(item.id)),
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
          setConfigValue('styles', [...allStyles, item]);
        }}
        onUpdate={(item, index) => {
          const styles = [...allStyles];
          styles[index] = item;
          setConfigValue('styles', styles);
        }}
        onRemove={(_, index) => {
          const styles = [...allStyles];
          styles.splice(index, 1);
          setConfigValue('styles', styles);
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
                      setConfigValue('styles', [
                        ...allStyles,
                        {
                          id: nanoid(),
                          name,
                          nodeType: 'group',
                          parentId,
                        },
                      ]);
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
};

export const SettingsStyles: React.FC = () => {
  return (
    <TabPanel id="styles">
      <h2>Prompt styles</h2>
      <SettingsStylesFolder />
    </TabPanel>
  );
};
