import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Model } from '@metastable/types';

import styles from './index.module.scss';
import { mainStore } from '../../stores/MainStore';
import { Modal } from '../../components';
import { useModal } from '../../contexts/modal';
import { Card, List } from '../../components/list';
import { getStaticUrl } from '../../config';
import { fuzzy } from '../../utils/fuzzy';
import { removeFileExtension } from '../../utils/string';
import { BsChevronRight, BsFolder, BsHouseFill } from 'react-icons/bs';

interface Props {
  type: string;
  onSelect: (model: Model) => void;
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

export const ModelSelect: React.FC<Props> = observer(({ type, onSelect }) => {
  const { close } = useModal();
  const data = mainStore.info.models[type] || [];
  const [parts, setParts] = useState<string[]>([]);

  const models = listFiles(data, parts, false);
  const allModels = listFiles(data, parts, true);
  const directories = listDirectories(data, parts.length);

  return (
    <Modal title="Select model">
      <div className={styles.breadcrumbs}>
        <button onClick={() => setParts([])}>
          <BsHouseFill />
        </button>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <BsChevronRight />
            <button onClick={() => setParts(parts => parts.slice(0, i + 1))}>
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>
      <List
        items={[...directories, ...models]}
        quickFilter={(_, search) =>
          fuzzy(
            allModels,
            search,
            item => `${item.name} ${removeFileExtension(item.file.name)}`,
          )
        }
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
              name={item.name || removeFileExtension(item.file.name)}
              key={item.file.name}
              imageUrl={
                item.image
                  ? getStaticUrl(`/models/${type}/${item.image}`)
                  : undefined
              }
              onClick={() => {
                onSelect(item);
                close();
              }}
            />
          )
        }
      </List>
    </Modal>
  );
});
