import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsPencil, BsTrash } from 'react-icons/bs';

import { API } from '$api';
import { IconButton } from '$components/iconButton';
import { TabPanel } from '$components/tabs';
import {
  VarArrayWithModal,
  VarButton,
  VarCategory,
  VarPath,
  VarScope,
  VarString,
} from '$components/var';
import styles from './index.module.scss';

interface ModelFoldersListProps {
  title: string;
  type: ModelType;
}

const ModelFoldersList: React.FC<ModelFoldersListProps> = ({ title, type }) => {
  return (
    <VarCategory label={title}>
      <VarArrayWithModal
        addModalTitle="Add folder"
        editModalTitle="Edit folder"
        path={type}
        footer={({ add }) => (
          <VarButton buttonLabel="Add folder" onClick={add} />
        )}
        getEmptyObject={() => ({ name: '', path: '' })}
        onValidate={async ({ data, array, index }) => {
          data.name = data.name.trim();
          data.path = data.path.trim();

          if (!data.name || !data.path) {
            throw new Error('Name and path must be set.');
          }

          const names = array.map(item => item.name);
          if (typeof index === 'number') {
            names.splice(index, 1);
          }

          if (names.includes(data.name)) {
            throw new Error('Name must be unique per model type.');
          }

          await API.instance.validateModelPath.query(data.path);

          return data;
        }}
        modalChildren={
          <VarCategory label="Model folder">
            <VarString path="name" label="Name" />
            <VarPath path="path" label="Path" />
          </VarCategory>
        }
      >
        {({ remove, edit, element }) => (
          <div className={styles.item}>
            <div>
              {element.name} - {element.path}
            </div>
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

export const SettingsModelFolders: React.FC = observer(() => {
  return (
    <TabPanel id="modelFolders">
      <h2>Model folders</h2>
      <VarScope path="modelFolders">
        <ModelFoldersList title="Checkpoints" type={ModelType.CHECKPOINT} />
        <ModelFoldersList title="LORAs" type={ModelType.LORA} />
      </VarScope>
    </TabPanel>
  );
});
