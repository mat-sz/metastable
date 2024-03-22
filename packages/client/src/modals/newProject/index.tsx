import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { Modal, ModalActions } from '$components/modal';
import { mainStore } from '$stores/MainStore';
import { Button } from '$components/button';

export const NewProject: React.FC = observer(() => {
  const [projectName, setProjectName] = useState('');
  return (
    <Modal title="New project" size="small">
      <div>
        <label>
          <div>Name:</div>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </label>
      </div>
      <ModalActions>
        <Button
          variant="primary"
          onClick={() => mainStore.projects.create(projectName)}
        >
          Create
        </Button>
      </ModalActions>
    </Modal>
  );
});
