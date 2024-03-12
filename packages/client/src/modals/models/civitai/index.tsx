import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BsDownload, BsHeartFill, BsSearch } from 'react-icons/bs';
import { MdNoPhotography } from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';

import { Card, CardTag, CardTags, List } from '$components/list';
import { Pagination } from '$components/pagination';
import { Loading } from '$components/loading';
import { Toggle } from '$components/toggle';
import { IconButton } from '$components/iconButton';
import { Rating } from '$components/rating';
import styles from './index.module.scss';
import { CivitAIModel, CivitAIResponse } from './types';
import { Model } from './Model';

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
}

async function fetchCivitAI({
  query,
  type,
  nsfw,
  sort = 'Highest Rated',
  limit = 48,
  page = 1,
}: CivitAIArgs): Promise<CivitAIResponse> {
  const url = new URL('https://civitai.com/api/v1/models');
  url.searchParams.append('query', query);
  if (type) {
    url.searchParams.append('types', type);
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
    queryKey: ['fetchModels', args.query, args.type, args.page, args.nsfw],
    queryFn: () => fetchCivitAI(args),
  });

  if (item) {
    return <Model model={item} onClose={() => setItem(undefined)} />;
  }

  return (
    <>
      <div className={styles.search}>
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
        <Toggle
          label="NSFW"
          value={!!args.nsfw}
          onChange={value => setArgs(args => ({ ...args, nsfw: value }))}
        />
      </div>
      {isLoading && (
        <div className={styles.loading}>
          <Loading />
        </div>
      )}
      {error && <div className={styles.info}>{`${error}`}</div>}
      {data?.items && (
        <>
          <List items={data.items}>
            {item => (
              <Card
                name={item.name}
                imageUrl={item.modelVersions?.[0]?.images[0]?.url}
                onClick={() => setItem(item)}
                key={item.id}
                icon={<MdNoPhotography />}
              >
                <CardTags>
                  <CardTag icon={<Rating value={item.stats.rating} small />}>
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
            )}
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
    </>
  );
});
