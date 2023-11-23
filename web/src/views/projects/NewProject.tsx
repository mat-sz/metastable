import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components/Modal';

export const NewProject: React.FC = observer(() => {
  const [projectName, setProjectName] = useState('');
  return (
    <Modal
      title="New project"
      isOpen={mainStore.modal === 'new_project'}
      onClose={() => (mainStore.modal = undefined)}
    >
      <div>
        <label>
          <span>Name:</span>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </label>
      </div>
      <button onClick={() => mainStore.projects.create(projectName)}>
        Create a new project
      </button>
    </Modal>
  );
});
