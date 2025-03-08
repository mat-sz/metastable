import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import {
  VarCategory,
  VarNumber,
  VarSelect,
  VarSlider,
  VarString,
  VarUI,
} from '$components/var';
import { useModalContext } from '$hooks/useModal';
import { mainStore } from '$stores/MainStore';
import { SimpleProject } from '$stores/project';
import {
  ExternalSettings,
  loadSettingsFromFile,
} from '$utils/externalSettings';
import { assign } from '$utils/object';

interface Props {
  project: SimpleProject;
  file?: File;
  loadedSettings?: ExternalSettings;
}

export const ProjectLoadPrompt: React.FC<Props> = observer(
  ({ project, file, loadedSettings }) => {
    const { close } = useModalContext();
    const [loaded, setLoaded] = useState(false);
    const [settings, setSettings] = useState<ExternalSettings>();

    const load = useCallback(
      async (file: File) => {
        setLoaded(false);
        setSettings(await loadSettingsFromFile(file));
        setLoaded(true);
      },
      [setLoaded, setSettings],
    );

    useEffect(() => {
      setLoaded(false);
      if (loadedSettings) {
        setSettings(toJS(loadedSettings));
        setLoaded(true);
      } else if (file) {
        load(file);
      } else {
        setSettings(undefined);
        setLoaded(true);
      }
    }, [file, loadedSettings, load, setLoaded, setSettings]);

    return (
      <Modal title="Load prompt" size="small">
        {loaded ? (
          settings ? (
            <>
              <div>Found the following settings:</div>
              <VarUI values={settings} onChange={setSettings}>
                {settings.prompt && (
                  <VarCategory label="Prompt" collapsible>
                    <VarString
                      label="Positive"
                      path="prompt.positive"
                      multiline
                    />
                    <VarString
                      label="Negative"
                      path="prompt.negative"
                      multiline
                    />
                  </VarCategory>
                )}
                {settings.sampler && (
                  <VarCategory label="Sampler" collapsible>
                    {typeof settings.sampler.seed !== 'undefined' && (
                      <VarNumber label="Seed" path="sampler.seed" />
                    )}
                    {typeof settings.sampler.steps !== 'undefined' && (
                      <VarSlider
                        label="CFG"
                        path="sampler.cfg"
                        min={0}
                        max={30}
                        step={0.5}
                        defaultValue={8}
                        showInput
                      />
                    )}
                    {typeof settings.sampler.cfg !== 'undefined' && (
                      <VarSlider
                        label="Steps"
                        path="sampler.steps"
                        min={1}
                        max={150}
                        step={1}
                        defaultValue={20}
                        showInput
                      />
                    )}
                    {typeof settings.sampler.samplerName !== 'undefined' && (
                      <VarSelect
                        label="Sampler"
                        path="sampler.samplerName"
                        options={mainStore.info.samplers.map(name => ({
                          key: name,
                          label: name,
                        }))}
                      />
                    )}
                    {typeof settings.sampler.schedulerName !== 'undefined' && (
                      <VarSelect
                        label="Scheduler"
                        path="sampler.schedulerName"
                        options={mainStore.info.schedulers.map(name => ({
                          key: name,
                          label: name,
                        }))}
                      />
                    )}
                  </VarCategory>
                )}
              </VarUI>
            </>
          ) : (
            <div>This file doesn't seem to contain any supported metadata.</div>
          )
        ) : (
          <div>Loading...</div>
        )}
        <ModalActions>
          {loaded && settings ? (
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (settings) {
                    const newSettings = assign(
                      toJS(project.settings),
                      toJS(settings),
                    ) as any;
                    project.setSettings(newSettings);
                  }
                  close();
                }}
              >
                Use
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={close}>
                Close
              </Button>
            </>
          )}
        </ModalActions>
      </Modal>
    );
  },
);
