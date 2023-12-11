import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction, toJS } from 'mobx';
import { VarCategory, VarUI } from 'react-var-ui';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { validateSettings } from '../../../helpers';
import { General } from './sections/General';
import { LoRAs } from './sections/LoRAs';
import { Controlnets } from './sections/Controlnets';

interface SettingsProps {
  actions?: JSX.Element;
}

export const Settings: React.FC<SettingsProps> = observer(({ actions }) => {
  const project = mainStore.project!;

  const [tab, setTab] = useState('conditioning');
  const tabs: Record<string, { title: string; children: JSX.Element }> = {
    conditioning: {
      title: 'General',
      children: <General />,
    },
    loras: {
      title: 'LoRAs',
      children: <LoRAs />,
    },
    controlnets: {
      title: 'Controlnets',
      children: <Controlnets />,
    },
  };

  return (
    <div className={styles.settings}>
      <ul className={styles.categories}>
        {Object.entries(tabs).map(([key, { title }]) => (
          <li
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? styles.active : undefined}
          >
            {title}
          </li>
        ))}
      </ul>
      <div className={styles.prompt}>
        <VarUI
          onChange={values => {
            runInAction(() => {
              project.settings = validateSettings(values);
            });
          }}
          values={toJS(project.settings)}
        >
          {actions && <VarCategory label="Actions">{actions}</VarCategory>}
          {tabs[tab].children}
        </VarUI>
      </div>
    </div>
  );
});
