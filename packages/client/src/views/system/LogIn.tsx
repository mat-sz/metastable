import React, { useState } from 'react';

import { TRPC } from '$api';
import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { ModalActions, ModalContainer } from '$components/modal';
import { VarString, VarUI } from '$components/var';
import { mainStore } from '$stores/MainStore';
import styles from './LogIn.module.scss';

export const LogIn: React.FC = () => {
  const [data, setData] = useState<{ username: string; password: string }>({
    username: '',
    password: '',
  });

  const mutation = TRPC.auth.authenticate.useMutation();

  return (
    <div className={styles.wrapper}>
      <ModalContainer title="Log in" size="small">
        <div>
          {!!mutation.error && (
            <Alert variant="error">{mutation.error.message}</Alert>
          )}
          <VarUI onChange={setData} values={data!}>
            <VarString path="username" label="Username" />
            <VarString path="password" type="password" label="Password" />
          </VarUI>
        </div>
        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => close()}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={mutation.isPending}
            onClick={async () => {
              const result = await mutation.mutateAsync(data);
              if (result.token) {
                mainStore.setToken(result.token);
              }
            }}
          >
            Save
          </Button>
        </ModalActions>
      </ModalContainer>
    </div>
  );
};
