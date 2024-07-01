import { Model, ModelType } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsBoxFill, BsFolder, BsFolderFill } from 'react-icons/bs';

import { API } from '$api';
import { Breadcrumbs } from '$components/breadcrumbs';
import { IconButton } from '$components/iconButton';
import {
  Card,
  CardMenu,
  CardMenuItem,
  CardTag,
  CardTags,
  List,
} from '$components/list';
import { ModelDelete } from '$modals/modelDelete';
import { ModelEdit } from '$modals/modelEdit';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { modelStore } from '$stores/ModelStore';
import { IS_ELECTRON } from '$utils/config';
import { removeFileExtension, stringToColor } from '$utils/string';
import styles from './index.module.scss';

interface Props {
  type: ModelType;
  defaultParts?: string[];
  onSelect: (model: Model) => void;
  variant?: 'default' | 'small';
}

function listFiles(data: Model[], parts: string[], all = false) {
  const models: Model[] = [];

  for (const model of data) {
    if (!all && parts.length !== model.file.parts.length) {
      continue;
    }

    let fail = false;
    for (let i = 0; i < parts.length; i++) {
      if (model.file.parts[i] !== parts[i]) {
        fail = true;
        break;
      }
    }

    if (fail) {
      continue;
    }

    models.push(model);
  }

  return models;
}

function listDirectories(data: Model[], index: number) {
  const set = new Set<string>();

  for (const model of data) {
    const first = model.file.parts[index];
    if (first) {
      set.add(first);
    }
  }

  return [...set];
}

export const ModelBrowser: React.FC<Props> = observer(
  ({ type, onSelect, defaultParts = [], variant = 'default' }) => {
    const data = modelStore.type(type) || [];
    const [parts, setParts] = useState<string[]>(defaultParts);

    const models = listFiles(data, parts, false);
    const allModels = listFiles(data, parts, true);
    const directories = listDirectories(data, parts.length);

    return (
      <div className={clsx(styles.models, styles[variant])}>
        <div className={styles.header}>
          <Breadcrumbs value={parts} onChange={setParts} />
          {IS_ELECTRON && models[0] && (
            <IconButton
              title="Reveal in explorer"
              onClick={() => {
                API.electron.shell.showItemInFolder.mutate(models[0].file.path);
              }}
            >
              <BsFolderFill />
            </IconButton>
          )}
        </div>
        <List
          small={variant === 'small'}
          items={[...directories, ...models]}
          view={variant === 'small' ? 'list' : undefined}
          quickFilter={(_, search) =>
            mainStore.searchFn(
              allModels,
              search,
              item => `${item.name} ${removeFileExtension(item.file.name)}`,
            )
          }
          searchAutoFocus={variant === 'small'}
        >
          {item =>
            typeof item === 'string' ? (
              <Card
                name={item}
                key={item}
                icon={<BsFolder />}
                onClick={() => {
                  setParts(parts => [...parts, item]);
                }}
              />
            ) : (
              <Card
                name={item.name}
                key={item.file.name}
                color={stringToColor(item.file.name)}
                imageUrl={item.image?.thumbnailUrl}
                onClick={() => {
                  onSelect(item);
                }}
              >
                <CardTags>
                  {item.details?.baseType && (
                    <CardTag icon={<BsBoxFill />}>
                      {item.details?.baseType?.toUpperCase()}
                    </CardTag>
                  )}
                </CardTags>
                {variant !== 'small' && (
                  <CardMenu>
                    <CardMenuItem
                      onClick={() => {
                        modalStore.show(
                          <ModelEdit name={item.file.name} type={item.type} />,
                        );
                      }}
                    >
                      Edit
                    </CardMenuItem>
                    <CardMenuItem
                      onClick={() => {
                        modalStore.show(
                          <ModelDelete
                            name={item.file.name}
                            type={item.type}
                          />,
                        );
                      }}
                    >
                      Delete
                    </CardMenuItem>
                  </CardMenu>
                )}
              </Card>
            )
          }
        </List>
      </div>
    );
  },
);
