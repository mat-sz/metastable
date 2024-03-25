import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsDownload, BsHourglass } from 'react-icons/bs';
import { DownloadSettings, TaskState } from '@metastable/types';

import { filesize } from '$utils/file';
import { mainStore } from '$stores/MainStore';

interface DownloadButtonProps {
  files: DownloadSettings[];
}

export const DownloadButton: React.FC<DownloadButtonProps> = observer(
  ({ files }) => {
    const fileState = files.map(file =>
      mainStore.hasFile(file.type, file.name),
    );
    const allDownloaded = fileState.every(state => state === 'downloaded');
    const allQueued = fileState.every(
      state => state === 'queued' || state === 'downloaded',
    );
    const remaining = files.filter(
      (_, i) => typeof fileState[i] === 'undefined',
    );
    const isWaiting = files.some(file =>
      mainStore.tasks.waiting.has(file.name),
    );

    if (isWaiting) {
      return (
        <button disabled>
          <BsHourglass />
          <span>Retrieving metadata</span>
        </button>
      );
    } else if (allDownloaded) {
      return (
        <button disabled>
          <BsDownload />
          <span>Already downloaded</span>
        </button>
      );
    } else if (allQueued) {
      const items = mainStore.tasks.downloads.filter(
        item =>
          !!files.find(file => file.name === item.data.name) &&
          [
            TaskState.SUCCESS,
            TaskState.RUNNING,
            TaskState.QUEUED,
            TaskState.PREPARING,
          ].includes(item.state),
      );

      if (items.length) {
        const percent =
          Math.round(
            (items.reduce((progress, item) => progress + item.data.offset, 0) /
              items.reduce((size, item) => size + item.data.size, 0)) *
              100,
          ) || 0;

        return (
          <button disabled>
            <BsDownload />
            <span>Downloading ({percent}%)</span>
          </button>
        );
      } else {
        return (
          <button disabled>
            <BsDownload />
            <span>In queue</span>
          </button>
        );
      }
    }

    const size = remaining.reduce((size, item) => size + (item.size || 0), 0);

    return (
      <button
        onClick={() => {
          for (const file of remaining) {
            mainStore.tasks.download(file);
          }
        }}
      >
        <BsDownload />
        <span>
          Download {remaining.length > 1 && `(${remaining.length} files)`}{' '}
          {!!size && `(${filesize(size)})`}
        </span>
      </button>
    );
  },
);
