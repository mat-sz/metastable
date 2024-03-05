import React from 'react';
import { observer } from 'mobx-react-lite';

import { useUI } from '$components/ui';
import { NewProject } from '$modals/newProject';
import { OpenProject } from '$modals/openProject';
import { ModelManager } from '$modals/models';
import { Config } from '$modals/config';
import { mainStore } from '$stores/MainStore';

interface Props {
  className?: string;
}

export const Menu: React.FC<Props> = observer(({ className }) => {
  const { showModal } = useUI();

  return (
    <div className={className}>
      <button
        onClick={() => showModal(<NewProject />)}
        disabled={!mainStore.hasCheckpoint}
      >
        New
      </button>
      <button onClick={() => showModal(<OpenProject />)}>Open</button>
      {!!mainStore.project && (
        <>
          <button onClick={() => mainStore.project?.save()}>Save</button>
        </>
      )}
      <button onClick={() => showModal(<ModelManager />)}>Model manager</button>
      <button onClick={() => showModal(<Config />)}>Settings</button>
    </div>
  );
});
