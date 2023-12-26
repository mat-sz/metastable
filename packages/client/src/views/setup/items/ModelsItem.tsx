import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsArrowUpRightSquare, BsBoxFill, BsStarFill } from 'react-icons/bs';

import styles from './ModelsItem.module.scss';
import { Item } from '../components/Item';
import { TYPE_NAMES, downloadable } from '../../../data/models';
import { IconButton } from '../../../components';
import { Checkbox } from '../../../components/checkbox';
import { ModelList } from '../../../components/modelList';
import { mainStore } from '../../../stores/MainStore';
import { runInAction, toJS } from 'mobx';
import { DownloadableModel } from '../../../types/model';

interface ModelCheckboxProps {
  model: DownloadableModel;
}

const ModelCheckbox: React.FC<ModelCheckboxProps> = observer(({ model }) => {
  const value = !!mainStore.setup.downloads.find(
    file => !!model.downloads.find(f => f.name === file.name),
  );

  return (
    <Checkbox
      value={value}
      onChange={value => {
        runInAction(() => {
          if (value) {
            mainStore.setup.downloads = [
              ...mainStore.setup.downloads.filter(
                file => !model.downloads.find(f => f.name === file.name),
              ),
              ...model.downloads,
            ];
          } else {
            mainStore.setup.downloads = mainStore.setup.downloads.filter(
              file => !model.downloads.find(f => f.name === file.name),
            );
          }
        });
      }}
    />
  );
});

export const ModelsItem: React.FC = observer(() => {
  const item = mainStore.setup.models;

  return (
    <Item
      id="models"
      icon={<BsBoxFill />}
      title="Models"
      description={item.description}
      status={item.status}
    >
      <ModelList beforeModel={model => <ModelCheckbox model={model} />} />
    </Item>
  );
});
