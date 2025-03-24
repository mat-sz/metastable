import React from 'react';
import {
  BsArrowLeft,
  BsArrowUpRightSquare,
  BsDownload,
  BsHandThumbsDownFill,
  BsHandThumbsUpFill,
} from 'react-icons/bs';

import { Carousel } from '$components/carousel';
import { IconButton } from '$components/iconButton';
import { Tab, TabContent, TabPanel, Tabs, TabView } from '$components/tabs';
import styles from './Model.module.scss';
import { CivitAIModel, CivitAIModelVersion, CivitAITypeMap } from './types';
import { DownloadButton } from '../DownloadButton';

interface ModelVersionProps {
  model: CivitAIModel;
  version: CivitAIModelVersion;
}

const ModelVersion: React.FC<ModelVersionProps> = ({ model, version }) => {
  const primaryFile = version.files.find(file => file.primary);
  const imageUrl = version.images[0]?.url;
  const type = CivitAITypeMap[model.type];

  const configFile = version.files.find(file => file.type === 'Config');
  const configUrl = configFile?.downloadUrl;
  const configType = configFile?.name?.split('.')?.pop();

  return (
    <div className={styles.version}>
      <div className={styles.main}>
        <div>
          {type && primaryFile ? (
            <DownloadButton
              files={[
                {
                  name: `${version.id}_${primaryFile.name}`,
                  type,
                  url: primaryFile.downloadUrl,
                  size: primaryFile.sizeKB * 1024,
                  imageUrl,
                  configUrl,
                  configType,
                  metadata: {
                    name: `${model.name} - ${version.name}`,
                    nsfw: model.nsfw,
                    source: 'civitai',
                    sourceId: `${model.id}`,
                    homepage: `https://civitai.com/models/${model.id}`,
                    baseModel: version.baseModel,
                  },
                },
              ]}
            />
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
              Votes: +{version.stats.thumbsUpCount}/-
              {version.stats.thumbsDownCount}
            </div>
          </div>
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
};

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
        <IconButton href={`https://civitai.com/models/${model.id}`}>
          <BsArrowUpRightSquare />
        </IconButton>
      </div>
      <div className={styles.stats}>
        <div>
          <span>{model.type}</span>
        </div>
        <div>
          <BsHandThumbsUpFill />
          <span>{model.stats.thumbsUpCount}</span>
        </div>
        <div>
          <BsHandThumbsDownFill />
          <span>{model.stats.thumbsDownCount}</span>
        </div>
        <div>
          <BsDownload />
          <span>{model.stats.downloadCount}</span>
        </div>
      </div>
      <TabView defaultTab={0}>
        <Tabs>
          {model.modelVersions.map((version, index) => (
            <Tab key={index} id={index} title={version.name} />
          ))}
        </Tabs>
        <TabContent>
          {model.modelVersions.map((version, index) => (
            <TabPanel key={index} id={index}>
              <ModelVersion model={model} version={version} />
            </TabPanel>
          ))}
        </TabContent>
      </TabView>
    </div>
  );
};
