import { CheckpointType, PromptStyle } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import { TabPanel } from '$components/tabs';
import {
  VarArray,
  VarButton,
  VarCategory,
  VarSelect,
  VarString,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';

const MAPPED_ARCHITECTURES = Object.entries(CheckpointType).map(
  ([label, value]) => ({ key: value, label, value }),
);

export const SettingsStyles: React.FC = observer(() => {
  const config = mainStore.config;

  return (
    <TabPanel id="styles">
      <VarArray path="styles">
        {(_, i) => (
          <VarCategory
            label={
              <>
                <span>Style</span>
                <IconButton
                  title="Delete"
                  onClick={() => {
                    const styles = [...(config.data?.styles || [])];
                    styles.splice(i, 1);
                    config.set({ ...config.data!, styles });
                  }}
                >
                  <BsX />
                </IconButton>
              </>
            }
            forceBorder
          >
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
            <VarString path="positive" label="Positive prompt" multiline />
            <VarString path="negative" label="Negative prompt" multiline />
          </VarCategory>
        )}
      </VarArray>
      <VarButton
        buttonLabel="Add style"
        onClick={() => {
          const styles: PromptStyle[] = [
            ...(config.data?.styles || []),
            { id: nanoid(), name: '' },
          ];
          config.set({ ...config.data!, styles });
        }}
      />
      <div className={styles.hint}>
        <strong>Hint:</strong> Use {'{prompt}'} if you'd like for the input
        prompt to be placed inside of the style prompt.
      </div>
    </TabPanel>
  );
});
