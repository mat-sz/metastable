import { PostprocessSettings } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { Button } from '$components/button';
import { FieldRenderer } from '$components/fieldRenderer';
import { Modal, ModalActions } from '$components/modal';
import { VarScope, VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import type { SimpleProject } from '$stores/project';

interface Props {
  project: SimpleProject;
  imageMrn: string;
}

export const ProjectPostprocess: React.FC<Props> = observer(
  ({ imageMrn, project }) => {
    const sections = Object.entries(mainStore.postprocessFields);
    const [settings, setSettings] = useState<PostprocessSettings>({
      input: {
        image: imageMrn,
      },
      featureData: {},
    });

    return (
      <Modal title="Postprocess image" size="small">
        <VarUI onChange={setSettings} values={settings}>
          <VarScope path="featureData">
            {sections.map(([key, section]) => (
              <FieldRenderer id={key} field={section} isRoot />
            ))}
          </VarScope>
        </VarUI>
        <ModalActions>
          <Button variant="secondary" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              project.postprocess(settings);
              close();
            }}
          >
            Start
          </Button>
        </ModalActions>
      </Modal>
    );
  },
);
