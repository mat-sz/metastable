import { DownloadSettings, TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsDownload, BsHourglass, BsXCircleFill } from 'react-icons/bs';

import { mainStore } from '$stores/MainStore';
import { modelStore } from '$stores/ModelStore';
import { filesize } from '$utils/file';

interface DownloadButtonProps {
  files: DownloadSettings[];
}

interface DownloadFileState {
  settings: DownloadSettings;
  state: 'downloaded' | 'queued' | 'failed' | 'not_queued';
  size?: number;
  offset?: number;
  error?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = observer(
  ({ files }) => {
    const fileState: DownloadFileState[] = files.map(file => {
      const model = modelStore.find(file.type, file.name);
      if (model) {
        return {
          settings: file,
          state: 'downloaded',
          size: model.file.size,
        };
      }

      const item = mainStore.tasks.queues.downloads?.find(
        item => item.data.name === file.name,
      );

      if (!item) {
        return {
          settings: file,
          state: 'not_queued',
        };
      }

      switch (item.state) {
        case TaskState.SUCCESS:
          return {
            settings: file,
            state: 'downloaded',
            size: item.data?.size,
          };
        case TaskState.RUNNING:
        case TaskState.QUEUED:
        case TaskState.PREPARING:
          return {
            settings: file,
            state: 'queued',
            offset: item.data?.offset,
            size: item.data?.size,
          };
        case TaskState.FAILED: {
          const log = item.log?.split('\n');
          return {
            settings: file,
            state: 'failed',
            error:
              log && log[log.length - 1].includes('Authorization required')
                ? 'Authorization required'
                : 'Download failed',
          };
        }
        case TaskState.CANCELLED:
        case TaskState.CANCELLING:
          return {
            settings: file,
            state: 'failed',
            error: 'Cancelled',
          };
      }

      return {
        settings: file,
        state: 'queued',
      };
    });
    const allDownloaded = fileState.every(item => item.state === 'downloaded');
    const allQueued = fileState.every(
      item => item.state === 'queued' || item.state === 'downloaded',
    );
    const remaining = fileState.filter(item => item.state === 'queued');
    const isWaiting = fileState.some(file =>
      mainStore.tasks.waiting.has(file.settings.name),
    );
    const failed = fileState.find(file => file.state === 'failed');

    if (failed) {
      return (
        <button disabled>
          <BsXCircleFill />
          <span>{failed.error}</span>
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
      if (remaining.length) {
        const percent =
          Math.round(
            (remaining.reduce(
              (progress, item) => progress + (item.offset || 0),
              0,
            ) /
              remaining.reduce((size, item) => size + (item.size || 0), 0)) *
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
            mainStore.tasks.download(file.settings);
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
