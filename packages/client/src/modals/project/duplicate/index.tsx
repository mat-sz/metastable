import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions } from '$components/modal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectDuplicate: React.FC<Props> = observer(({ project }) => {
  return (
    <Modal
      title="Duplicate project"
      size="small"
      onSubmit={async values => {
        const name = values['name'];
        if (typeof name !== 'string') {
          throw new Error('Invalid project name');
        }

        await project.duplicate(name.trim());
      }}
    >
      <div>Choose a name for the new project.</div>
      <div>
        <Label label="New name" required>
          <input name="name" type="text" defaultValue={project.name} />
        </Label>
      </div>
      <ModalActions>
        <Button variant="primary">Duplicate</Button>
      </ModalActions>
    </Modal>
  );
});
