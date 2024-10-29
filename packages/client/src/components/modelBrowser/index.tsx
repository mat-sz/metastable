import { Architecture, Model, ModelType } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  BsBoxFill,
  BsExclamationTriangleFill,
  BsFolder,
  BsFolderFill,
} from 'react-icons/bs';
import { ContextMenuDivider, ContextMenuItem } from 'use-context-menu';

import { API } from '$api';
import { Breadcrumbs } from '$components/breadcrumbs';
import { IconButton } from '$components/iconButton';
import { Card, CardTag, CardTags, List } from '$components/list';
import { Toggle } from '$components/toggle';
import { ModelDelete } from '$modals/modelDelete';
import { ModelEdit } from '$modals/modelEdit';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { modelStore } from '$stores/ModelStore';
import { IS_ELECTRON } from '$utils/config';
import { removeFileExtension, stringToColor } from '$utils/string';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';

interface Props {
  type: ModelType;
  defaultParts?: string[];
  onSelect: (model: Model) => void;
  variant?: 'default' | 'small';
  architecture?: Architecture;
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
  ({
    type,
    onSelect,
    defaultParts = [],
    variant = 'default',
    architecture,
  }) => {
    const [parts, setParts] = useState<string[]>(defaultParts);
    const [compatibleOnly, setCompatibleOnly] = useState(true);

    let data = modelStore.type(type) || [];
    if (architecture && compatibleOnly) {
      data = data.filter(item => item.details?.architecture === architecture);
    }

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
          {!!architecture && (
            <div>
              <Toggle
                label="Compatibility filter"
                value={compatibleOnly}
                onChange={setCompatibleOnly}
              />
            </div>
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
                imageUrl={resolveImage(item.coverMrn, 'thumbnail')}
                onClick={() => {
                  onSelect(item);
                }}
                menu={
                  variant !== 'small' ? (
                    <>
                      {!!item.metadata?.homepage && (
                        <ContextMenuItem
                          onSelect={() => {
                            window.open(
                              item.metadata?.homepage,
                              '_blank',
                              'noopener noreferrer',
                            );
                          }}
                        >
                          View homepage
                        </ContextMenuItem>
                      )}
                      <ContextMenuItem
                        onSelect={() => {
                          modalStore.show(
                            <ModelEdit
                              name={item.file.name}
                              type={item.type}
                            />,
                          );
                        }}
                      >
                        Edit
                      </ContextMenuItem>
                      <ContextMenuDivider />
                      <ContextMenuItem
                        onSelect={() => {
                          modalStore.show(
                            <ModelDelete
                              name={item.file.name}
                              type={item.type}
                            />,
                          );
                        }}
                      >
                        Delete
                      </ContextMenuItem>
                    </>
                  ) : undefined
                }
              >
                <CardTags>
                  {item.details?.architecture && (
                    <CardTag icon={<BsBoxFill />}>
                      {item.details?.architecture?.toUpperCase()}
                    </CardTag>
                  )}
                  {item.details?.corrupt && (
                    <CardTag
                      variant="warning"
                      icon={<BsExclamationTriangleFill />}
                    >
                      CORRUPT
                    </CardTag>
                  )}
                </CardTags>
              </Card>
            )
          }
        </List>
      </div>
    );
  },
);
