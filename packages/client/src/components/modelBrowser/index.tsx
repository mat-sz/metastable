import { Architecture, Model, ModelType } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  BsArrowClockwise,
  BsBox,
  BsBoxFill,
  BsCheckCircle,
  BsCheckCircleFill,
  BsExclamationTriangleFill,
  BsFolder,
  BsFolderFill,
  BsXLg,
} from 'react-icons/bs';
import { ContextMenuDivider, ContextMenuItem } from 'use-context-menu';

import { API } from '$api';
import { Breadcrumbs } from '$components/breadcrumbs';
import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { Card, CardTags, List } from '$components/list';
import { Tag } from '$components/tag';
import { ModelDelete } from '$modals/model/delete';
import { ModelEdit } from '$modals/model/edit';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { modelStore } from '$stores/ModelStore';
import { uiStore } from '$stores/UIStore';
import { arrayStartsWith } from '$utils/array';
import { IS_ELECTRON } from '$utils/config';
import { removeFileExtension, stringToColor } from '$utils/string';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';

interface Props {
  type: ModelType | ModelType[];
  defaultParts?: string[];
  allowReset?: boolean;
  onSelect: (model: Model | undefined) => void;
  variant?: 'default' | 'small';
  architecture?: Architecture;
}

function listFiles(data: Model[], parts: string[], all = false) {
  const models: Model[] = [];

  for (const model of data) {
    if (!all && parts.length !== model.file.parts.length) {
      continue;
    }

    if (!arrayStartsWith(model.file.parts, parts)) {
      continue;
    }

    models.push(model);
  }

  return models;
}

function listDirectories(data: Model[], parts: string[]) {
  const set = new Set<string>();

  for (const model of data) {
    if (
      model.file.parts.length !== parts.length + 1 ||
      !arrayStartsWith(model.file.parts, parts)
    ) {
      continue;
    }

    const first = model.file.parts[parts.length];
    if (first) {
      set.add(first);
    }
  }

  return [...set];
}

interface ModelBrowserListProps {
  parts: string[];
  data: Model[];
  variant?: 'default' | 'small';
  setParts: React.Dispatch<React.SetStateAction<string[]>>;
  onSelect: (model: Model | undefined) => void;
}

export const ModelBrowserList: React.FC<ModelBrowserListProps> = observer(
  ({ data, variant, parts, setParts, onSelect }) => {
    const models = listFiles(data, parts, false);
    const allModels = listFiles(data, parts, true);
    const directories = listDirectories(data, parts);

    return (
      <List
        small={variant === 'small'}
        items={[...directories, ...models]}
        view={variant === 'small' ? 'list' : undefined}
        noResultsView={
          <>
            <div className={styles.hint}>No models found.</div>
            <Button
              className={styles.selection}
              onClick={() => uiStore.setView('models')}
              icon={<BsBox />}
            >
              Download models
            </Button>
          </>
        }
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
              key={item.mrn}
              color={stringToColor(item.mrn)}
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
                        modalStore.show(<ModelEdit mrn={item.mrn} />);
                      }}
                    >
                      Edit
                    </ContextMenuItem>
                    <ContextMenuDivider />
                    <ContextMenuItem
                      onSelect={() => {
                        modalStore.show(<ModelDelete mrn={item.mrn} />);
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
                  <Tag icon={<BsBoxFill />}>
                    {item.details?.architecture?.toUpperCase()}
                  </Tag>
                )}
                {item.details?.corrupt && (
                  <Tag variant="warning" icon={<BsExclamationTriangleFill />}>
                    CORRUPT
                  </Tag>
                )}
              </CardTags>
            </Card>
          )
        }
      </List>
    );
  },
);

export const ModelBrowser: React.FC<Props> = observer(
  ({
    type,
    onSelect,
    defaultParts = [],
    variant = 'default',
    architecture,
    allowReset,
  }) => {
    const [parts, setParts] = useState<string[]>(defaultParts);
    const [compatibleOnly, setCompatibleOnly] = useState(true);
    const types = Array.isArray(type) ? type : [type];

    let data = types.flatMap(type => modelStore.type(type) || []);
    if (architecture && compatibleOnly) {
      data = data.filter(item => item.details?.architecture === architecture);
    }

    const models = listFiles(data, parts, false);

    return (
      <div
        className={clsx(styles.models, styles[variant])}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className={styles.header}>
          <Breadcrumbs value={parts} onChange={setParts} />
          <div className={styles.actions}>
            {!!architecture && (
              <IconButton
                title={
                  compatibleOnly
                    ? 'Disable compatibility filter'
                    : 'Enable compatibility filter'
                }
                onClick={() => setCompatibleOnly(value => !value)}
                className={clsx({ [styles.enabled]: compatibleOnly })}
              >
                {compatibleOnly ? <BsCheckCircleFill /> : <BsCheckCircle />}
              </IconButton>
            )}
            <IconButton
              title="Refresh"
              onClick={() => {
                modelStore.refresh(true);
              }}
            >
              <BsArrowClockwise />
            </IconButton>
            {IS_ELECTRON && models[0] && (
              <IconButton
                title="Reveal in explorer"
                onClick={() => {
                  API.electron.shell.showItemInFolder.mutate(models[0].mrn);
                }}
              >
                <BsFolderFill />
              </IconButton>
            )}
            {allowReset && (
              <IconButton
                title="Reset"
                onClick={() => {
                  onSelect(undefined);
                }}
              >
                <BsXLg />
              </IconButton>
            )}
          </div>
        </div>
        {modelStore.isLoading ? (
          <div className={styles.info}>
            <span>Loading...</span>
          </div>
        ) : (
          <ModelBrowserList
            data={data}
            onSelect={onSelect}
            parts={parts}
            setParts={setParts}
            variant={variant}
          />
        )}
      </div>
    );
  },
);
