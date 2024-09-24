import { observer } from 'mobx-react-lite';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Link } from '$components/link';
import { TabPanel } from '$components/tabs';
import { VarButton, VarCategory, VarToggle } from '$components/var';
import { BundleReset } from '$modals/bundleReset';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { IS_ELECTRON } from '$utils/config';
import styles from './index.module.scss';
import { Social } from '../../common/Social';

export const SettingsAbout: React.FC = observer(() => {
  return (
    <TabPanel id="about">
      <VarCategory label="About Metastable">
        <div className={styles.info}>
          <div>
            {__APP_NAME__} {__APP_VERSION__}
          </div>
          <Social />
        </div>
      </VarCategory>
      <VarCategory label="Storage">
        <div className={styles.info}>
          <div>
            <strong>Application data is stored at:</strong>{' '}
            {mainStore.info.dataRoot}
          </div>
        </div>
        {IS_ELECTRON && (
          <VarButton
            buttonLabel="Reveal in explorer"
            onClick={() =>
              API.electron.shell.showItemInFolder.mutate(
                mainStore.info.dataRoot,
              )
            }
          />
        )}
      </VarCategory>
      {(mainStore.updateInfo.isAutoUpdateAvailable ||
        mainStore.updateInfo.canCheckForUpdate) && (
        <VarCategory label="Updates">
          {mainStore.updateInfo.isAutoUpdateAvailable && (
            <VarToggle path="app.autoUpdate" label="Enable automatic updates" />
          )}
          {mainStore.updateInfo.canCheckForUpdate && (
            <div className={styles.info}>
              <div>
                {mainStore.updateInfoReady
                  ? typeof mainStore.updateInfo.isUpToDate === 'undefined'
                    ? 'Unable to check for updates.'
                    : mainStore.updateInfo.isUpToDate
                      ? 'Up to date.'
                      : `New version available: ${mainStore.updateInfo.latestVersion}.`
                  : 'Loading...'}
              </div>
              <div className={styles.buttons}>
                <Button onClick={() => mainStore.checkForUpdates()}>
                  Check for updates
                </Button>
                <Button href="https://github.com/mat-sz/metastable/blob/main/CHANGELOG.md">
                  Changelog
                </Button>
              </div>
            </div>
          )}
        </VarCategory>
      )}
      <VarCategory label="Reset">
        <div className={styles.info}>
          <div className={styles.buttons}>
            <Button onClick={() => modalStore.show(<BundleReset />)}>
              Reset settings and Python dependencies
            </Button>
          </div>
          <p>This action will not delete your models or projects.</p>
        </div>
      </VarCategory>
      <VarCategory label="Credits">
        <div className={styles.info}>
          {__APP_NAME__} includes code from the following open source projects:
          <ul>
            <li>
              <Link href="https://github.com/comfyanonymous/ComfyUI">
                ComfyUI
              </Link>
            </li>
            <li>
              <Link href="https://github.com/Stability-AI/stablediffusion">
                Stable Diffusion
              </Link>
            </li>
            <li>
              <Link href="https://github.com/cubiq/ComfyUI_IPAdapter_plus">
                ComfyUI IPAdapter Plus
              </Link>
            </li>
            <li>
              <Link href="https://github.com/tencent-ailab/IP-Adapter">
                IPAdapter
              </Link>
            </li>
            <li>
              <Link href="https://github.com/kohya-ss/sd-scripts">
                Kohya SD Scripts
              </Link>
            </li>
          </ul>
        </div>
      </VarCategory>
    </TabPanel>
  );
});
