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
  BsFolderFill,
  BsPlusLg,
  BsXLg,
} from 'react-icons/bs';
import { ContextMenuDivider, ContextMenuItem } from 'use-context-menu';

import { API } from '$api';
import { Button } from '$components/button';
import { IconButton } from '$components/iconButton';
import { CardTags } from '$components/list';
import { Tag } from '$components/tag';
import { TreeBrowser } from '$components/treeBrowser';
import { getItemsFactory, listItems } from '$components/treeBrowser/helpers';
import { TreeBrowserItem } from '$components/treeBrowser/types';
import { ModelDelete } from '$modals/model/delete';
import { ModelEdit } from '$modals/model/edit';
import { mainStore } from '$stores/MainStore';
import { modalStore } from '$stores/ModalStore';
import { modelStore } from '$stores/ModelStore';
import { uiStore } from '$stores/UIStore';
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

export const ModelBrowser: React.FC<Props> = observer(
  ({
    type,
    defaultParts,
    onSelect,
    variant = 'default',
    architecture,
    allowReset,
  }) => {
    const [compatibleOnly, setCompatibleOnly] = useState(true);
    const types = Array.isArray(type) ? type : [type];

    let data = types.flatMap(type => modelStore.type(type) || []);
    if (architecture && compatibleOnly) {
      data = data.filter(item => item.details?.architecture === architecture);
    }

    return (
      <TreeBrowser
        small={variant === 'small'}
        view={variant === 'small' ? 'list' : undefined}
        defaultParts={defaultParts}
        showBreadcrumbs
        actions={items => {
          const first = items.find(item => item.type === 'item');

          return (
            <>
              {variant === 'small' && (
                <IconButton
                  title="Add more models"
                  onClick={() => {
                    uiStore.setView('models');
                  }}
                >
                  <BsPlusLg />
                </IconButton>
              )}
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
              {IS_ELECTRON && first && (
                <IconButton
                  title="Reveal in explorer"
                  onClick={() => {
                    API.electron.shell.showItemInFolder.mutate(first.data.mrn);
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
            </>
          );
        }}
        onSelect={item => onSelect(item?.data)}
        getItems={getItemsFactory(
          data,
          model => model.mrn,
          model => model.file?.parts,
        )}
        getCardProps={item => {
          const model = item.data;

          return {
            name: model.name,
            color: stringToColor(model.mrn),
            imageUrl: resolveImage(model.coverMrn, 'thumbnail'),
            menu:
              variant !== 'small' ? (
                <>
                  {!!model.metadata?.homepage && (
                    <ContextMenuItem
                      onSelect={() => {
                        window.open(
                          model.metadata?.homepage,
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
                      modalStore.show(<ModelEdit mrn={model.mrn} />);
                    }}
                  >
                    Edit
                  </ContextMenuItem>
                  <ContextMenuDivider />
                  <ContextMenuItem
                    onSelect={() => {
                      modalStore.show(<ModelDelete mrn={model.mrn} />);
                    }}
                  >
                    Delete
                  </ContextMenuItem>
                </>
              ) : undefined,
            children: (
              <CardTags>
                {model.details?.architecture && (
                  <Tag icon={<BsBoxFill />}>
                    {model.details?.architecture?.toUpperCase()}
                  </Tag>
                )}
                {model.details?.corrupt && (
                  <Tag variant="warning" icon={<BsExclamationTriangleFill />}>
                    CORRUPT
                  </Tag>
                )}
              </CardTags>
            ),
          };
        }}
        noResultsView={
          <>
            <div className={styles.hint}>No models found.</div>
            <Button onClick={() => uiStore.setView('models')} icon={<BsBox />}>
              Download models
            </Button>
          </>
        }
        quickFilter={(_: any, parts: string[], search) =>
          mainStore
            .searchFn(
              listItems(data, model => model.file?.parts, parts, true),
              search,
              item => `${item.name} ${removeFileExtension(item.file.name)}`,
            )
            .map(model => {
              return {
                id: model.mrn,
                type: 'item',
                data: model,
              } as TreeBrowserItem<any>;
            })
        }
      />
    );
  },
);
