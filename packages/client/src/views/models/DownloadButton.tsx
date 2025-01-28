import { DownloadSettings, TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsDownload, BsHourglass, BsXCircleFill } from 'react-icons/bs';

import { Button } from '$components/button';
import { ModelDownload } from '$modals/model';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { modelStore } from '$stores/ModelStore';
import { filesize } from '$utils/file';

interface DownloadButtonProps {
  files: DownloadSettings[];
  onDownload?: () => void;
}

interface DownloadFileState {
  settings: DownloadSettings;
  state: 'downloaded' | 'queued' | 'failed' | 'not_queued';
  size?: number;
  offset?: number;
  error?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = observer(
  ({ files, onDownload }) => {
    const fileState: DownloadFileState[] = files.map(file => {
      const model = modelStore.findByName(file.type, file.name);
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
          size: file.size,
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
        size: file.size,
      };
    });
    const allDownloaded = fileState.every(item => item.state === 'downloaded');
    const allQueued = fileState.every(
      item => item.state === 'queued' || item.state === 'downloaded',
    );
    const toDownload = fileState.filter(item => item.state === 'not_queued');
    const remaining = fileState.filter(
      item => item.state === 'not_queued' || item.state === 'queued',
    );
    const isWaiting = fileState.some(file =>
      mainStore.tasks.waiting.has(file.settings.name),
    );
    const failed = fileState.find(file => file.state === 'failed');

    if (failed) {
      return (
        <Button icon={<BsXCircleFill />} disabled>
          {failed.error}
        </Button>
      );
    } else if (isWaiting) {
      return (
        <Button icon={<BsHourglass />} disabled>
          Retrieving metadata
        </Button>
      );
    } else if (allDownloaded) {
      return (
        <Button icon={<BsDownload />} disabled>
          Already downloaded
        </Button>
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
          <Button icon={<BsDownload />} disabled>
            Downloading ({percent}%)
          </Button>
        );
      } else {
        return (
          <Button icon={<BsDownload />} disabled>
            In queue
          </Button>
        );
      }
    }

    const size = toDownload.reduce((size, item) => size + (item.size || 0), 0);

    return (
      <Button
        icon={<BsDownload />}
        onClick={() => {
          modalStore.show(
            <ModelDownload downloads={toDownload} onDownload={onDownload} />,
          );
        }}
      >
        Download {toDownload.length > 1 && `(${toDownload.length} files)`}{' '}
        {!!size && `(${filesize(size)})`}
      </Button>
    );
  },
);
