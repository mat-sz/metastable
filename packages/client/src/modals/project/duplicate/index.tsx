import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions } from '$components/modal';
import { useModalContext } from '$hooks/useModal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDuplicate: React.FC<Props> = observer(({ project }) => {
  const { close } = useModalContext();
  const [projectName, setProjectName] = useState(project.name);

  return (
    <Modal title="Duplicate project" size="small">
      <div>Choose a name for the new project.</div>
      <div>
        <Label label="New name" required>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </Label>
      </div>
      <ModalActions>
        <Button variant="secondary" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            close();
            const name = projectName.trim();
            project.duplicate(name);
          }}
        >
          Duplicate
        </Button>
      </ModalActions>
    </Modal>
  );
});
