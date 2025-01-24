import { Architecture } from '@metastable/types';
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
import styles from './index.module.scss';

const MAPPED_ARCHITECTURES = Object.entries(Architecture).map(
  ([label, value]) => ({ key: value, label, value }),
);

export const SettingsStyles: React.FC = observer(() => {
  return (
    <TabPanel id="styles">
      <h2>Prompt styles</h2>
      <VarArrayWithModal
        addModalTitle="Add prompt style"
        editModalTitle="Edit prompt style"
        path="styles"
        footer={({ add }) => (
          <VarButton buttonLabel="Add style" onClick={add} />
        )}
        getEmptyObject={() => ({ id: nanoid(), architecture: 'any' })}
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
    </TabPanel>
  );
});
