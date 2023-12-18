import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsDownload, BsHourglass, BsXCircle } from 'react-icons/bs';

import { mainStore } from '../../stores/MainStore';
import { DownloadFile } from '../../types/model';
import { filesize } from '../../helpers';

interface DownloadButtonProps {
  files: DownloadFile[];
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
      mainStore.downloads.waiting.has(file.name),
    );
    const error = files
      .map(file => mainStore.downloads.errors[file.name])
      .find(error => !!error);

    if (error) {
      return (
        <button disabled>
          <BsXCircle />
          <span>{error}</span>
        </button>
      );
    } else if (isWaiting) {
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
      const items = mainStore.downloads.queue.filter(
        item =>
          !!files.find(file => file.name === item.name) &&
          ['done', 'queued', 'in_progress'].includes(item.state),
      );

      if (items.length) {
        const percent =
          Math.round(
            (items.reduce((progress, item) => progress + item.progress, 0) /
              items.reduce((size, item) => size + item.size, 0)) *
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
            mainStore.downloads.download(file.type, file.url, file.name);
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
