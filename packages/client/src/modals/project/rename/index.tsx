import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions, useModal } from '$components/modal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
  closeAfterRenaming?: boolean;
}

export const ProjectRename: React.FC<Props> = observer(
  ({ project, closeAfterRenaming }) => {
    const { close } = useModal();
    const [projectName, setProjectName] = useState(project.name);

    return (
      <Modal title="Rename project" size="small">
        <div>Choose a new name for the project.</div>
        <Label label="New name" required>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </Label>
        <ModalActions>
          <Button variant="secondary" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              const name = projectName.trim();
              if (name && name !== project.name) {
                close();

                await project.save({ name });
                if (closeAfterRenaming) {
                  project.close(true);
                }
              }
            }}
          >
            Save
          </Button>
        </ModalActions>
      </Modal>
    );
  },
);
