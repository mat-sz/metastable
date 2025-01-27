import { useQuery } from '@tanstack/react-query';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import {
  BsDownload,
  BsHandThumbsDownFill,
  BsHandThumbsUpFill,
  BsSearch,
} from 'react-icons/bs';
import { MdNoPhotography } from 'react-icons/md';

import { IconButton } from '$components/iconButton';
import { Label } from '$components/label';
import { Card, CardTags, List } from '$components/list';
import { Loading } from '$components/loading';
import { Tag } from '$components/tag';
import { Toggle } from '$components/toggle';
import { CivitAIArgs, uiStore } from '$stores/UIStore';
import styles from './index.module.scss';
import { Model } from './Model';
import { CivitAIModel, CivitAIResponse } from './types';

const CivitAISort = [
  'Highest Rated',
  'Most Downloaded',
  'Most Liked',
  'Most Buzz',
  'Most Discussed',
  'Most Collected',
  'Most Images',
  'Newest',
];

async function fetchCivitAI({
  query,
  type,
  nsfw,
  sort = 'Highest Rated',
  limit = 48,
  cursor,
  baseModels,
}: CivitAIArgs): Promise<CivitAIResponse> {
  const url = new URL('https://civitai.com/api/v1/models');
  url.searchParams.append('query', query);
  if (type) {
    url.searchParams.append('types', type);
  }
  if (baseModels) {
    url.searchParams.append('baseModels', `${baseModels}`);
  }
  url.searchParams.append('nsfw', `${nsfw}`);
  url.searchParams.append('sort', sort);
  url.searchParams.append('limit', `${limit}`);
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  const res = await fetch(url);
  return await res.json();
}

const CivitAICategories = {
  Checkpoint: 'Checkpoint',
  TextualInversion: 'Embedding',
  Hypernetwork: 'Hypernetwork',
  LORA: 'LoRA',
  Controlnet: 'Controlnet',
};

const CivitAIBaseModels = [
  'SD 1.4',
  'SD 1.5',
  'SD 1.5 LCM',
  'SD 1.5 Hyper',
  'SD 2.0',
  'SD 2.1',
  'SDXL 1.0',
  'SD 3',
  'Pony',
  'SDXL 1.0 LCM',
  'SDXL Turbo',
  'SDXL Lightning',
  'SDXL Hyper',
  'Stable Cascade',
  'SVD',
  'SVD XT',
  'Playground V2',
  'PixArt A',
  'PixArt E',
  'Flux.1 S',
  'Flux.1 D',
  'Other',
];

export const CivitAI: React.FC = observer(() => {
  const [query, setQuery] = useState('');

  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const args = uiStore.civitaiArgs;
  const [item, setItem] = useState<CivitAIModel | undefined>();
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'fetchModels',
      args.query,
      args.type,
      args.cursor,
      args.nsfw,
      args.baseModels,
      args.sort,
    ],
    queryFn: () => fetchCivitAI(args),
  });

  if (item) {
    return <Model model={item} onClose={() => setItem(undefined)} />;
  }

  const goBack = () => {
    if (!cursorHistory.length) {
      return;
    }

    const previous = cursorHistory[cursorHistory.length - 2];
    setCursorHistory(history => history.slice(0, -1));
    runInAction(() => {
      uiStore.civitaiArgs = { ...uiStore.civitaiArgs, cursor: previous };
    });
  };

  const updateArgs = (newArgs: Partial<CivitAIArgs>) => {
    const cursor = newArgs.cursor;
    if (cursor) {
      setCursorHistory(history => [...history, cursor]);
    } else {
      setCursorHistory([]);
    }

    runInAction(() => {
      uiStore.civitaiArgs = {
        ...uiStore.civitaiArgs,
        cursor: undefined,
        ...newArgs,
      };
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.search}>
        <div className={styles.searchTitle}>Filters</div>
        <form
          className={styles.searchInput}
          onSubmit={e => {
            e.preventDefault();
            updateArgs({ query });
          }}
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Query"
          />
          <IconButton>
            <BsSearch />
          </IconButton>
        </form>
        <Label label="Model type">
          <select
            value={args.type}
            onChange={e => updateArgs({ type: e.target.value })}
          >
            {Object.entries(CivitAICategories).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </Label>
        <Label label="Base model">
          <select
            value={args.baseModels || ''}
            onChange={e =>
              updateArgs({
                baseModels: e.target.value || undefined,
              })
            }
          >
            <option value="">Any</option>
            {CivitAIBaseModels.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Label>
        <Label label="Sort by">
          <select
            value={args.sort}
            onChange={e => updateArgs({ sort: e.target.value })}
          >
            {CivitAISort.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Label>
        <Toggle
          label="NSFW"
          value={!!args.nsfw}
          onChange={value => updateArgs({ nsfw: value })}
        />
      </div>
      <div className={styles.results}>
        {isLoading && (
          <div className={styles.loading}>
            <Loading />
          </div>
        )}
        {error && <div className={styles.info}>{`${error}`}</div>}
        {data?.items && (
          <>
            <List items={data.items}>
              {item => {
                const image = item.modelVersions?.[0]?.images[0];

                return (
                  <Card
                    name={item.name}
                    imageUrl={image?.url}
                    isVideo={image?.type === 'video'}
                    onClick={() => setItem(item)}
                    key={item.id}
                    icon={<MdNoPhotography />}
                  >
                    <CardTags>
                      <Tag icon={<BsHandThumbsUpFill />}>
                        {item.stats.thumbsUpCount}
                      </Tag>
                      <Tag icon={<BsHandThumbsDownFill />}>
                        {item.stats.thumbsDownCount}
                      </Tag>
                      <Tag icon={<BsDownload />}>
                        {item.stats.downloadCount}
                      </Tag>
                    </CardTags>
                  </Card>
                );
              }}
            </List>
            <div className={styles.navigation}>
              {!!cursorHistory.length && (
                <button onClick={goBack}>Previous</button>
              )}
              {!!data.metadata.nextCursor && (
                <button
                  onClick={() => {
                    updateArgs({ cursor: data.metadata.nextCursor });
                  }}
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
