import { Architecture, Model, ModelType } from '@metastable/types';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  BsArrowClockwise,
  BsArrowUpRightSquare,
  BsBox,
  BsBoxFill,
  BsCheckCircle,
  BsCheckCircleFill,
  BsExclamationTriangleFill,
  BsFolderFill,
  BsPencil,
  BsPlusLg,
  BsTrash,
  BsXLg,
} from 'react-icons/bs';

import { API } from '$api';
import { Button } from '$components/button';
import { ContextMenuDivider, ContextMenuItem } from '$components/contextMenu';
import { IconButton } from '$components/iconButton';
import { CardTags } from '$components/list';
import { Tag } from '$components/tag';
import { TreeBrowser } from '$components/treeBrowser';
import { useModalWrapperContext } from '$hooks/useModal';
import { ModelDelete } from '$modals/model/delete';
import { ModelEdit } from '$modals/model/edit';
import { useSearchFn } from '$store/config/hooks';
import { modelStore } from '$stores/ModelStore';
import { IS_ELECTRON } from '$utils/config';
import { removeFileExtension, stringToColor } from '$utils/string';
import { removeEmptyGroups } from '$utils/tree';
import { resolveImage } from '$utils/url';
import styles from './index.module.scss';

interface Props {
  type: ModelType | ModelType[];
  defaultParentId?: string;
  allowReset?: boolean;
  onSelect: (model: Model | undefined) => void;
  variant?: 'default' | 'small';
  architecture?: Architecture;
}

export const ModelBrowser: React.FC<Props> = observer(
  ({
    type,
    defaultParentId,
    onSelect,
    variant = 'default',
    architecture,
    allowReset,
  }) => {
    const searchFn = useSearchFn();
    const modalWrapper = useModalWrapperContext();
    const [compatibleOnly, setCompatibleOnly] = useState(true);
    const types = Array.isArray(type) ? type : [type];

    let data = types.flatMap(type => modelStore.treeNodes[type] || []);
    if (architecture && compatibleOnly) {
      data = data.filter(
        item =>
          item.nodeType === 'group' ||
          item.details?.architecture === architecture,
      );
    }
    data = removeEmptyGroups(data);

    return (
      <TreeBrowser
        small={variant === 'small'}
        view={variant === 'small' ? 'list' : undefined}
        defaultParentId={defaultParentId}
        showBreadcrumbs
        actions={items => {
          const first = items.find(item => item.nodeType === 'item');

          return (
            <>
              {variant === 'small' && (
                <IconButton title="Add more models" href="/models">
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
                    API.electron.shell.showItemInFolder.mutate(first.mrn);
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
        onSelect={item => onSelect(item)}
        nodes={data}
        getCardProps={model => ({
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
                    icon={<BsArrowUpRightSquare />}
                  >
                    View homepage
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  onSelect={() => {
                    modalWrapper.open(<ModelEdit mrn={model.mrn} />);
                  }}
                  icon={<BsPencil />}
                >
                  Edit model
                </ContextMenuItem>
                <ContextMenuDivider />
                <ContextMenuItem
                  onSelect={() => {
                    modalWrapper.open(<ModelDelete mrn={model.mrn} />);
                  }}
                  icon={<BsTrash />}
                  variant="danger"
                >
                  Delete model
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
        })}
        noResultsView={
          <>
            <div className={styles.hint}>No models found.</div>
            <Button href="/models" icon={<BsBox />}>
              Download models
            </Button>
          </>
        }
        quickFilter={(models, search) =>
          searchFn(
            models,
            search,
            item =>
              `${item.name} ${item.nodeType === 'item' ? removeFileExtension(item.file.name) : ''}`,
          )
        }
      />
    );
  },
);
