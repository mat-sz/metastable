import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions, useModal } from '$components/modal';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const TemporaryProject: React.FC<Props> = observer(({ project }) => {
  const { close } = useModal();
  const [projectName, setProjectName] = useState('');

  return (
    <Modal title="Temporary project" size="small">
      <div>This project is temporary. Would you like to save it?</div>
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
          variant="danger"
          onClick={() => {
            project.delete();
            close();
          }}
        >
          Delete
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const name = projectName.trim();
            if (name && name !== project.name) {
              project.close(true);
              project.save(name);
              close();
            }
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
});
