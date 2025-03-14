import { observer } from 'mobx-react-lite';
import React from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Link } from '$components/link';
import { TabPanel } from '$components/tabs';
import { VarButton, VarCategory, VarToggle } from '$components/var';
import { useModalWrapperContext } from '$hooks/useModal';
import { InstanceBundleReset } from '$modals/instance/bundleReset';
import { InstanceSettingsReset } from '$modals/instance/settingsReset';
import { useUpdateStore } from '$store/update';
import { mainStore } from '$stores/MainStore';
import { IS_ELECTRON } from '$utils/config';
import styles from './index.module.scss';
import { Social } from '../../common/Social';

export const SettingsAbout: React.FC = observer(() => {
  const info = useUpdateStore(state => state.info);
  const ready = useUpdateStore(state => state.ready);
  const refresh = useUpdateStore(state => state.refresh);
  const canResetBundle = mainStore.config.data?.python.mode === 'static';
  const modalWrapper = useModalWrapperContext();

  return (
    <TabPanel id="about">
      <h2>About {__APP_NAME__}</h2>
      <VarCategory label={`About ${__APP_NAME__}`}>
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
              API.electron.shell.openPath.mutate(mainStore.info.dataRoot)
            }
          />
        )}
      </VarCategory>
      {(info.isAutoUpdateAvailable || info.canCheckForUpdate) && (
        <VarCategory label="Updates">
          {info.isAutoUpdateAvailable && (
            <VarToggle path="app.autoUpdate" label="Enable automatic updates" />
          )}
          {info.canCheckForUpdate && (
            <div className={styles.info}>
              <div>
                {ready
                  ? typeof info.isUpToDate === 'undefined'
                    ? 'Unable to check for updates.'
                    : info.isUpToDate
                      ? 'Up to date.'
                      : `New version available: ${info.latestVersion}.`
                  : 'Loading...'}
              </div>
              <div className={styles.buttons}>
                <Button onClick={refresh}>Check for updates</Button>
                <Button href="https://github.com/mat-sz/metastable/blob/main/CHANGELOG.md">
                  View changelog
                </Button>
              </div>
            </div>
          )}
        </VarCategory>
      )}
      <VarCategory label="Reset">
        <div className={styles.info}>
          <div>This action will not delete your models or projects.</div>
          <div className={styles.buttons}>
            {canResetBundle && (
              <>
                <Button
                  onClick={() =>
                    modalWrapper.open(<InstanceBundleReset resetAll />)
                  }
                >
                  Reset bundle and all settings
                </Button>
                <Button
                  onClick={() => modalWrapper.open(<InstanceBundleReset />)}
                >
                  Reset bundle
                </Button>
              </>
            )}
            <Button
              onClick={() => modalWrapper.open(<InstanceSettingsReset />)}
            >
              Reset all settings
            </Button>
          </div>
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
            <li>
              <Link href="https://github.com/ToTheBeginning/PuLID">PuLID</Link>
            </li>
            <li>
              <Link href="https://github.com/cubiq/PuLID_ComfyUI">
                ComfyUI PuLID node
              </Link>
            </li>
            <li>
              <Link href="https://github.com/facebookresearch/sam2">
                Segment Anything 2
              </Link>
            </li>
            <li>
              <Link href="https://github.com/kijai/ComfyUI-segment-anything-2">
                ComfyUI Segment Anything 2 node
              </Link>
            </li>
          </ul>
        </div>
      </VarCategory>
    </TabPanel>
  );
});
