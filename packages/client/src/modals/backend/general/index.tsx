import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { BsArrowClockwise, BsClipboard } from 'react-icons/bs';

import { API, TRPC } from '$api';
import { IconButton } from '$components/iconButton';
import { mainStore } from '$stores/MainStore';
import { copy } from '$utils/clipboard';
import { filesize } from '$utils/file';
import styles from './index.module.scss';
import { LogItem } from '@metastable/types';

export const General: React.FC = observer(() => {
  const torchInfo = mainStore.torchInfo;
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
      <div className={styles.logWrapper}>
        <IconButton
          className={styles.copy}
          onClick={() => {
            copy(
              log
                .map(
                  item =>
                    `[${new Date(item.timestamp).toLocaleTimeString()}] ${
                      item.text
                    }`,
                )
                .join('\n'),
            );
          }}
        >
          <BsClipboard />
        </IconButton>
        <div className={styles.log} ref={logRef}>
          {log.map((item, i) => (
            <div
              key={i}
              className={clsx({ [styles.error]: item.type === 'stderr' })}
            >
              <span className={styles.timestamp}>
                [{new Date(item.timestamp).toLocaleTimeString()}]
              </span>
              <span className={styles.text}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
