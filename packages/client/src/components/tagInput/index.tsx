import clsx from 'clsx';
import React, { useMemo, useRef, useState } from 'react';

import { Tag } from '$components/tag';
import { TagIcon } from '$components/tagIcon';
import styles from './index.module.scss';

export interface TagInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  className,
  value = [],
  onChange,
}) => {
  const [newTag, setNewTag] = useState('');
  const uniqueTags = useMemo(() => [...new Set(value)], [value]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={clsx(styles.wrapper, className)}
      onClick={() => {
        inputRef.current?.focus();
      }}
    >
      {uniqueTags.map(tag => (
        <Tag
          key={tag}
          icon={<TagIcon tag={tag} />}
          onDelete={() => {
            onChange?.([...uniqueTags.filter(item => item !== tag)]);
          }}
        >
          {tag}
        </Tag>
      ))}
      <input
        className={styles.newTag}
        type="text"
        value={newTag}
        onChange={e => setNewTag(e.target.value)}
        ref={inputRef}
        onKeyDown={e => {
          const newTagValue = newTag.trim();
          if (e.key === 'Enter' && newTagValue) {
            onChange?.([...new Set([...value, newTagValue])]);
            setNewTag('');
          }
        }}
      />
    </div>
  );
};
