import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { BsDownload, BsHeartFill, BsSearch } from 'react-icons/bs';
import { MdNoPhotography } from 'react-icons/md';

import { IconButton } from '$components/iconButton';
import { Label } from '$components/label';
import { Card, CardTag, CardTags, List } from '$components/list';
import { Loading } from '$components/loading';
import { Pagination } from '$components/pagination';
import { Rating } from '$components/rating';
import { Toggle } from '$components/toggle';
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

interface CivitAIArgs {
  query: string;
  type: string;
  nsfw: boolean;
  sort?: string;
  limit?: number;
  page?: number;
  baseModels?: string;
}

async function fetchCivitAI({
  query,
  type,
  nsfw,
  sort = 'Highest Rated',
  limit = 48,
  page = 1,
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
  url.searchParams.append('page', `${page}`);

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

  const [args, setArgs] = useState<CivitAIArgs>({
    query: '',
    type: 'Checkpoint',
    page: 1,
    nsfw: false,
  });
  const [item, setItem] = useState<CivitAIModel | undefined>();
  const { data, error, isLoading } = useQuery({
    queryKey: [
      'fetchModels',
      args.query,
      args.type,
      args.page,
      args.nsfw,
      args.baseModels,
    ],
    queryFn: () => fetchCivitAI(args),
  });

  if (item) {
    return <Model model={item} onClose={() => setItem(undefined)} />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.search}>
        <div className={styles.searchTitle}>Filters</div>
        <form
          className={styles.searchInput}
          onSubmit={e => {
            e.preventDefault();
            setArgs(args => ({ ...args, query }));
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
            onChange={e => setArgs(args => ({ ...args, type: e.target.value }))}
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
              setArgs(args => ({
                ...args,
                baseModels: e.target.value || undefined,
              }))
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
            onChange={e => setArgs(args => ({ ...args, sort: e.target.value }))}
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
          onChange={value => setArgs(args => ({ ...args, nsfw: value }))}
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
                      <CardTag
                        icon={<Rating value={item.stats.rating} small />}
                      >
                        ({item.stats.ratingCount})
                      </CardTag>
                    </CardTags>
                    <CardTags>
                      <CardTag icon={<BsDownload />}>
                        ({item.stats.downloadCount})
                      </CardTag>
                      <CardTag icon={<BsHeartFill />}>
                        ({item.stats.favoriteCount})
                      </CardTag>
                    </CardTags>
                  </Card>
                );
              }}
            </List>
            <Pagination
              current={data.metadata.currentPage}
              max={data.metadata.totalPages}
              onSelect={i => {
                setArgs(args => ({ ...args, page: i }));
              }}
            />
          </>
        )}
      </div>
    </div>
  );
});
