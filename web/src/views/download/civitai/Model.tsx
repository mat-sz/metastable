import React from 'react';
import {
  BsArrowLeft,
  BsArrowUpRightSquare,
  BsDownload,
  BsHeartFill,
} from 'react-icons/bs';
import { observer } from 'mobx-react-lite';

import styles from './Model.module.scss';
import {
  CivitAIModel,
  CivitAIModelVersion,
  CivitAITypeMap,
} from '../../../types/civitai';
import { IconButton } from '../../../components/IconButton';
import { Tab, TabPanel, TabView, Tabs } from '../../../components/Tabs';
import { Rating } from '../../../components/Rating';
import { mainStore } from '../../../stores/MainStore';
import { filesize } from '../../../helpers';
import { Carousel } from '../../../components/Carousel';

interface ModelVersionProps {
  model: CivitAIModel;
  version: CivitAIModelVersion;
}

const ModelVersion: React.FC<ModelVersionProps> = observer(
  ({ model, version }) => {
    const primaryFile = version.files.find(file => file.primary);
    const type = CivitAITypeMap[model.type];

    const primaryFilename = `${version.id}_${primaryFile?.name}`;
    const hasFile = mainStore.hasFile(type, primaryFilename);

    return (
      <div className={styles.version}>
        <div className={styles.main}>
          <div>
            {type && primaryFile ? (
              hasFile ? (
                <div>
                  {hasFile === 'downloaded'
                    ? 'Already downloaded.'
                    : 'Queued for download.'}
                </div>
              ) : (
                <button
                  onClick={() =>
                    mainStore.downloads.download(
                      type,
                      primaryFile.downloadUrl,
                      primaryFilename,
                    )
                  }
                >
                  Download ({filesize(primaryFile.sizeKB * 1024)})
                </button>
              )
            ) : (
              <div>Version not downloadable.</div>
            )}
          </div>
          <div>
            <div>
              <div>Type: {version.baseModelType}</div>
              <div>Base model: {version.baseModel}</div>
              <div>Downloads: {version.stats.downloadCount}</div>
              <div>
                Rating: {version.stats.rating} out of 5 (
                {version.stats.ratingCount} ratings)
              </div>
            </div>
            <Rating value={version.stats.rating} />
          </div>
        </div>
        <Carousel>
          {version.images.map(image => (
            <img
              src={image.url}
              key={image.id}
              crossOrigin="anonymous"
              width={image.width}
              height={image.height}
            />
          ))}
        </Carousel>
      </div>
    );
  },
);

interface ModelProps {
  model: CivitAIModel;
  onClose: () => void;
}
export const Model: React.FC<ModelProps> = ({ model, onClose }) => {
  return (
    <div className={styles.model}>
      <div className={styles.nav}>
        <IconButton onClick={onClose}>
          <BsArrowLeft />
        </IconButton>
        <div>{model.name}</div>
        <IconButton
          onClick={() =>
            window.open(
              `https://civitai.com/models/${model.id}`,
              '_blank',
              'noopener noreferrer',
            )
          }
        >
          <BsArrowUpRightSquare />
        </IconButton>
      </div>
      <div className={styles.stats}>
        <div>
          <Rating value={model.stats.rating} />
          <span>({model.stats.ratingCount})</span>
        </div>
        <div>
          <BsDownload />
          <span>({model.stats.downloadCount})</span>
        </div>
        <div>
          <BsHeartFill />
          <span>({model.stats.favoriteCount})</span>
        </div>
      </div>
      <TabView defaultTab={0}>
        <Tabs>
          {model.modelVersions.map((version, index) => (
            <Tab key={index} id={index} title={version.name} />
          ))}
        </Tabs>
        {model.modelVersions.map((version, index) => (
          <TabPanel key={index} id={index}>
            <ModelVersion model={model} version={version} />
          </TabPanel>
        ))}
      </TabView>
    </div>
  );
};
