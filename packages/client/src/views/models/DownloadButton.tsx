import { DownloadSettings, TaskState } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsDownload, BsHourglass, BsXCircleFill } from 'react-icons/bs';

import { Button } from '$components/button';
import { useModal } from '$hooks/useModal';
import { ModelDownload } from '$modals/model/download';
import { mainStore } from '$stores/MainStore';
import { modelStore } from '$stores/ModelStore';
import { DownloadFileInfo, DownloadFileState } from '$types/download';
import { filesize } from '$utils/file';

interface DownloadButtonProps {
  files: DownloadSettings[];
  onDownload?: () => void;
}

const mapFileToFileInfo = (file: DownloadSettings): DownloadFileInfo => {
  const model = modelStore.findByName(file.type, file.name);
  if (model) {
    return {
      settings: file,
      state: DownloadFileState.DOWNLOADED,
      size: model.file.size,
    };
  }

  const item = mainStore.tasks.queues.downloads?.find(
    item => item.data.name === file.name,
  );

  if (!item) {
    return {
      settings: file,
      state: DownloadFileState.NOT_QUEUED,
      size: file.size,
    };
  }

  switch (item.state) {
    case TaskState.SUCCESS:
      return {
        settings: file,
        state: DownloadFileState.DOWNLOADED,
        size: item.data?.size,
      };
    case TaskState.RUNNING:
    case TaskState.QUEUED:
    case TaskState.PREPARING:
      return {
        settings: file,
        state: DownloadFileState.QUEUED,
        offset: item.data?.offset,
        size: item.data?.size,
      };
    case TaskState.FAILED: {
      const log = item.log?.split('\n');
      return {
        settings: file,
        state: DownloadFileState.FAILED,
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
        state: DownloadFileState.FAILED,
        error: 'Cancelled',
      };
  }

  return {
    settings: file,
    state: DownloadFileState.QUEUED,
    size: file.size,
  };
};

export const DownloadButton: React.FC<DownloadButtonProps> = observer(
  ({ files, onDownload }) => {
    const fileState = files.map(mapFileToFileInfo);
    const allDownloaded = fileState.every(
      item => item.state === DownloadFileState.DOWNLOADED,
    );
    const allQueued = fileState.every(
      item =>
        item.state === DownloadFileState.QUEUED ||
        item.state === DownloadFileState.DOWNLOADED,
    );
    const toDownload = fileState.filter(
      item => item.state === DownloadFileState.NOT_QUEUED,
    );
    const remaining = fileState.filter(
      item =>
        item.state === DownloadFileState.NOT_QUEUED ||
        item.state === DownloadFileState.QUEUED,
    );
    const isWaiting = fileState.some(file =>
      mainStore.tasks.waiting.has(file.settings.name),
    );
    const failed = fileState.find(
      file => file.state === DownloadFileState.FAILED,
    );

    const { show } = useModal(
      <ModelDownload downloads={toDownload} onDownload={onDownload} />,
    );

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
      <Button icon={<BsDownload />} onClick={show}>
        Download {toDownload.length > 1 && `(${toDownload.length} files)`}{' '}
        {!!size && `(${filesize(size)})`}
      </Button>
    );
  },
);
