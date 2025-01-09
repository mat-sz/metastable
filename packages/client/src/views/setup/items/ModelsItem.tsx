import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsBoxFill } from 'react-icons/bs';

import { Checkbox } from '$components/checkbox';
import { ModelList } from '$components/modelList';
import { setupStore } from '$stores/SetupStore';
import { DownloadableModel } from '$types/model';
import { Item } from '../components/Item';

interface ModelCheckboxProps {
  model: DownloadableModel;
}

const ModelCheckbox: React.FC<ModelCheckboxProps> = observer(({ model }) => {
  const value = !!setupStore.downloads.find(
    file => !!model.downloads.find(f => f.name === file.name),
  );

  return (
    <Checkbox
      value={value}
      onChange={value => {
        runInAction(() => {
          if (value) {
            setupStore.downloads = [
              ...setupStore.downloads.filter(
                file => !model.downloads.find(f => f.name === file.name),
              ),
              ...model.downloads,
            ];
          } else {
            setupStore.downloads = setupStore.downloads.filter(
              file => !model.downloads.find(f => f.name === file.name),
            );
          }
        });
      }}
    />
  );
});

export const ModelsItem: React.FC = observer(() => {
  const item = setupStore.models;

  return (
    <Item
      id="models"
      icon={<BsBoxFill />}
      title="Models"
      description={item.description}
      status={item.status}
    >
      <ModelList
        beforeModel={model => <ModelCheckbox model={model} />}
        isSetup
      />
    </Item>
  );
});
