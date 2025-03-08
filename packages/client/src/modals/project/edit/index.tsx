import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { API } from '$api';
import { Button } from '$components/button';
import { Label } from '$components/label';
import { Modal, ModalActions } from '$components/modal';
import { TagInput } from '$components/tagInput';
import { BaseProject } from '$stores/project';

interface Props {
  project: BaseProject;
}

export const ProjectEdit: React.FC<Props> = observer(({ project }) => {
  const [tags, setTags] = useState(project.metadata.tags || []);

  return (
    <Modal
      title="Edit project"
      size="small"
      onSubmit={async () => {
        await API.project.update.mutate({
          projectId: project.id,
          tags,
        });
      }}
    >
      <Label label="Tags" required>
        <TagInput value={tags} onChange={setTags} />
      </Label>
      <ModalActions>
        <Button variant="primary">Save</Button>
      </ModalActions>
    </Modal>
  );
});
