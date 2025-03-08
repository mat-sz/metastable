import { observer } from 'mobx-react-lite';
import React from 'react';

import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions } from '$components/modal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
  closeAfterRenaming?: boolean;
}

export const ProjectRename: React.FC<Props> = observer(
  ({ project, closeAfterRenaming }) => {
    return (
      <Modal
        title="Rename project"
        size="small"
        onSubmit={async values => {
          let name = values['name'];
          if (typeof name !== 'string') {
            throw new Error('Invalid name.');
          }

          name = name.trim();
          if (!name) {
            throw new Error('Name is required.');
          }

          await project.save({ name });
          if (closeAfterRenaming) {
            project.close(true);
          }
        }}
      >
        <div>Choose a new name for the project.</div>
        <Label label="New name" required>
          <input name="name" type="text" />
        </Label>
        <ModalActions>
          <Button variant="primary">Save</Button>
        </ModalActions>
      </Modal>
    );
  },
);
