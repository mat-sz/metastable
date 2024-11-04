import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsPencil, BsTrash } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { TabPanel } from '$components/tabs';
import { VarArray, VarButton } from '$components/var';
import { SettingsPromptStyleAdd } from '$modals/settings/promptStyleAdd';
import { SettingsPromptStyleEdit } from '$modals/settings/promptStyleEdit';
import { modalStore } from '$stores/ModalStore';
import styles from './index.module.scss';

export const SettingsStyles: React.FC = observer(() => {
  return (
    <TabPanel id="styles">
      <h2>Prompt styles</h2>
      <VarArray
        path="styles"
        footer={({ append }) => (
          <VarButton
            buttonLabel="Add style"
            onClick={() => {
              modalStore.show(<SettingsPromptStyleAdd onAdd={append} />);
            }}
          />
        )}
      >
        {({ remove, update, element }) => (
          <div className={styles.style}>
            <div>{element.name}</div>
            <div className={styles.actions}>
              <IconButton
                onClick={() =>
                  modalStore.show(
                    <SettingsPromptStyleEdit value={element} onSave={update} />,
                  )
                }
              >
                <BsPencil />
              </IconButton>
              <IconButton onClick={remove}>
                <BsTrash />
              </IconButton>
            </div>
          </div>
        )}
      </VarArray>
    </TabPanel>
  );
});
