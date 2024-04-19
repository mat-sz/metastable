import { LogItem } from '@metastable/types';
import React, { useState } from 'react';

import { API, TRPC } from '$api';
import { Button } from '$components/button';
import { Log } from '$components/log';
import { Modal, ModalActions, useModal } from '$components/modal';

export const BackendError: React.FC = () => {
  const { close } = useModal();
  const [log, setLog] = useState<LogItem[]>([]);

  TRPC.instance.onBackendLog.useSubscription(undefined, {
    onData: items => {
      // TODO: trpc bug where the wrong response is being sent?
      if (Array.isArray(items)) {
        setLog(current => [...current, ...items]);
      }
    },
  });

  return (
    <Modal title="Backend error" size="small">
      <div>Unable to start backend. Details:</div>
      <Log items={log} />
      <ModalActions>
        <Button
          variant="secondary"
          onClick={() => {
            close();
          }}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            API.instance.restart.mutate();
            close();
          }}
        >
          Restart
        </Button>
      </ModalActions>
    </Modal>
  );
};
