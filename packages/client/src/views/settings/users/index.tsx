import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsPencil, BsPersonFillAdd, BsTrash } from 'react-icons/bs';

import { TRPC } from '$api';
import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { LoadingOverlay } from '$components/loadingOverlay';
import { TabPanel } from '$components/tabs';
import { modalStore } from '$stores/ModalStore';
import styles from './index.module.scss';
import { UserAdd } from './modals/add';
import { UserDelete } from './modals/delete';
import { UserEdit } from './modals/edit';

export const SettingsUsers: React.FC = observer(() => {
  const { data, isLoading, error, refetch } = TRPC.auth.get.useQuery();
  const setEnabledMutation = TRPC.auth.setEnabled.useMutation();

  const showLoading = setEnabledMutation.isPending || isLoading;

  return (
    <TabPanel id="users">
      <h2>Users</h2>
      {showLoading && <LoadingOverlay />}
      {!!error && <Alert variant="error">{error.message}</Alert>}
      {data && (
        <>
          <div className={styles.actions}>
            <Button
              onClick={async () => {
                await setEnabledMutation.mutateAsync(!data.enabled);
                refetch();
              }}
            >
              {data.enabled ? 'Disable' : 'Enable'} authentication
            </Button>
            <Button
              onClick={() => modalStore.show(<UserAdd onDone={refetch} />)}
              icon={<BsPersonFillAdd />}
            >
              Add a new user
            </Button>
          </div>
          {data.accounts.length ? (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map(account => (
                  <tr key={account.id}>
                    <td>{account.username}</td>
                    <td className={styles.rowActions}>
                      <IconButton
                        onClick={() =>
                          modalStore.show(
                            <UserEdit
                              username={account.username}
                              onDone={refetch}
                            />,
                          )
                        }
                      >
                        <BsPencil />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          modalStore.show(
                            <UserDelete
                              username={account.username}
                              onDone={refetch}
                            />,
                          )
                        }
                      >
                        <BsTrash />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.empty}>No user accounts.</div>
          )}
        </>
      )}
    </TabPanel>
  );
});
