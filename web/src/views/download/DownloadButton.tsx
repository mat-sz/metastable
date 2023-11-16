import React from 'react';
import { observer } from 'mobx-react-lite';
import { BsDownload } from 'react-icons/bs';

import { mainStore } from '../../stores/MainStore';
import { ModelType } from '../../types/model';
import { filesize } from '../../helpers';

interface DownloadButtonProps {
  filename: string;
  url: string;
  type: ModelType;
  size?: number;
}

export const DownloadButton: React.FC<DownloadButtonProps> = observer(
  ({ filename, type, size, url }) => {
    const hasFile = mainStore.hasFile(type, filename);

    if (hasFile === 'downloaded') {
      return (
        <button disabled>
          <BsDownload />
          <span>Already downloaded</span>
        </button>
      );
    } else if (hasFile === 'queued') {
      const item = mainStore.downloads.queue.find(
        item =>
          item.filename === filename &&
          ['done', 'queued', 'in_progress'].includes(item.state),
      );

      if (item) {
        const percent = Math.round((item.progress / item.size) * 100) || 0;

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

    return (
      <button onClick={() => mainStore.downloads.download(type, url, filename)}>
        <BsDownload />
        <span>Download {size && `(${filesize(size)})`}</span>
      </button>
    );
  },
);
