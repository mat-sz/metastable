import { LogItem } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import { BsArrowClockwise } from 'react-icons/bs';

import { API, TRPC } from '$api';
import { Log } from '$components/log';
import { mainStore } from '$stores/MainStore';
import { filesize } from '$utils/file';
import styles from './index.module.scss';

export const General: React.FC = observer(() => {
  const torchInfo = mainStore.info.torch;
  const [log, setLog] = useState<LogItem[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logEl = logRef.current;
    if (!logEl) {
      return;
    }

    logEl.scroll({ top: logEl.scrollHeight, left: 0, behavior: 'smooth' });
  }, []);

  TRPC.instance.onBackendLog.useSubscription(undefined, {
    onData: items => {
      setLog(current => [...current, ...items]);
    },
  });

  return (
    <>
      <div className={styles.actions}>
        <button onClick={() => API.instance.restart.mutate()}>
          <BsArrowClockwise />
          <span>Restart backend</span>
        </button>
      </div>
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
      <Log items={log} />
    </>
  );
});
