import React, { useState } from 'react';

import { API } from '$api';
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

  return (
    <div className={styles.wrapper}>
      <ModalContainer
        title="Log in"
        size="small"
        onSubmit={async () => {
          const result = await API.auth.authenticate.mutate(data);
          if (result.token) {
            mainStore.setToken(result.token);
          }
        }}
      >
        <div>
          <VarUI onChange={setData} values={data!}>
            <VarString path="username" label="Username" />
            <VarString path="password" type="password" label="Password" />
          </VarUI>
        </div>
        <ModalActions>
          <Button variant="primary">Save</Button>
        </ModalActions>
      </ModalContainer>
    </div>
  );
};
