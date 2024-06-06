import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsDownload, BsGear } from 'react-icons/bs';

import logo from '$/assets/logo.svg';
import { Link } from '$components/link';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import {
  VarButton,
  VarCategory,
  VarString,
  VarToggle,
  VarUI,
} from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './index.module.scss';
import { Social } from '../common/Social';

export const Settings: React.FC = observer(() => {
  const config = mainStore.config;

  if (!config.data) {
    return <div>Loading...</div>;
  }

  return (
    <VarUI
      values={toJS(config.data!)}
      onChange={value => config.set(value)}
      className={styles.settings}
    >
      <TabView defaultTab="general" variant="large" direction="vertical">
        <Tabs>
          <Tab id="general" title="General" icon={<BsGear />} />
          <Tab id="downloads" title="Downloads" icon={<BsDownload />} />
          <Tab
            id="about"
            title={`About ${__APP_NAME__}`}
            icon={<img src={logo} alt="Logo" />}
          />
        </Tabs>
        <TabContent className={styles.content}>
          <TabPanel id="general">
            <VarCategory label="User interface">
              <VarToggle path="ui.fuzzySearch" label="Use fuzzy search" />
            </VarCategory>
            <VarCategory label="Generation">
              <VarToggle path="generation.preview" label="Enable previews" />
              <VarToggle
                path="generation.imageMetadata"
                label="Store metadata in output image files"
              />
            </VarCategory>
          </TabPanel>
          <TabPanel id="downloads">
            <VarCategory label="CivitAI">
              <VarString path="civitai.apiKey" label="CivitAI API key" />
            </VarCategory>
          </TabPanel>
          <TabPanel id="about">
            <VarCategory label="About Metastable">
              <div className={styles.info}>
                <div>
                  {__APP_NAME__} {__APP_VERSION__}
                </div>
                <Social />
              </div>
            </VarCategory>
            {(mainStore.updateInfo.isAutoUpdateAvailable ||
              mainStore.updateInfo.canCheckForUpdate) && (
              <VarCategory label="Updates">
                {mainStore.updateInfo.isAutoUpdateAvailable && (
                  <VarToggle
                    path="app.autoUpdate"
                    label="Enable automatic updates"
                  />
                )}
                {mainStore.updateInfo.canCheckForUpdate && (
                  <>
                    <VarButton
                      buttonLabel="Check for updates"
                      onClick={() => mainStore.checkForUpdates()}
                    />
                    <div className={styles.info}>
                      {mainStore.updateInfoReady
                        ? typeof mainStore.updateInfo.isUpToDate === 'undefined'
                          ? 'Unable to check for updates.'
                          : mainStore.updateInfo.isUpToDate
                            ? 'Up to date.'
                            : `New version available: ${mainStore.updateInfo.latestVersion}.`
                        : 'Loading...'}
                    </div>
                  </>
                )}
              </VarCategory>
            )}
            <VarCategory label="Credits">
              <div className={styles.info}>
                {__APP_NAME__} is based on the following open source projects:
                <ul>
                  <li>
                    <Link href="https://github.com/comfyanonymous/ComfyUI">
                      ComfyUI
                    </Link>{' '}
                    - backend for image generation
                  </li>
                  <li>
                    <Link href="https://github.com/Stability-AI/stablediffusion">
                      Stable Diffusion
                    </Link>{' '}
                    - open source models for image generation
                  </li>
                </ul>
              </div>
            </VarCategory>
          </TabPanel>
        </TabContent>
      </TabView>
    </VarUI>
  );
});
