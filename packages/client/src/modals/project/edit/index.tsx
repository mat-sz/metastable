import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions, useModal } from '$components/modal';
import { TagInput } from '$components/tagInput';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectEdit: React.FC<Props> = observer(({ project }) => {
  const { close } = useModal();
  const [tags, setTags] = useState(project.metadata.tags || []);

  return (
    <Modal title="Edit project" size="small">
      <Label label="Tags" required>
        <TagInput value={tags} onChange={setTags} />
      </Label>
      <ModalActions>
        <Button variant="secondary" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            close();
            await API.project.update.mutate({
              projectId: project.id,
              tags,
            });
          }}
        >
          Save
        </Button>
      </ModalActions>
    </Modal>
  );
});
