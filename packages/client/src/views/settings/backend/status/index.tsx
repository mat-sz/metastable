import { observer } from 'mobx-react-lite';
import React from 'react';

import { RequirementsTable } from '$components/requirementsTable';
import { TabPanel } from '$components/tabs';
import { mainStore } from '$stores/MainStore';
import { setupStore } from '$stores/SetupStore';
import { filesize } from '$utils/file';

export const StatusTab: React.FC = observer(() => {
  const torchInfo = mainStore.info.torch;
  const requirements = setupStore.requirements;

  return (
    <TabPanel id="status">
      {torchInfo && (
        <table>
          <tbody>
            <tr>
              <th>Device name:</th>
              <td>{torchInfo.device.name}</td>
            </tr>
            <tr>
              <th>Device type:</th>
              <td>{torchInfo.device.type}</td>
            </tr>
            <tr>
              <th>Device index:</th>
              <td>{torchInfo.device.index ?? '(undefined)'}</td>
            </tr>
            <tr>
              <th>Allocator backend:</th>
              <td>{torchInfo.device.allocator_backend ?? '(undefined)'}</td>
            </tr>
            <tr>
              <th>RAM:</th>
              <td>{filesize(torchInfo.memory.ram)}</td>
            </tr>
            <tr>
              <th>VRAM:</th>
              <td>{filesize(torchInfo.memory.vram)}</td>
            </tr>
            <tr>
              <th>VAE dtype:</th>
              <td>{torchInfo.vae.dtype}</td>
            </tr>
          </tbody>
        </table>
      )}
      <RequirementsTable requirements={requirements} />
    </TabPanel>
  );
});
