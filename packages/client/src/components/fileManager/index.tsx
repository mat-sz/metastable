import { ImageFile } from '@metastable/types';
import clsx from 'clsx';
import React, { useState } from 'react';

import { FileList } from './FileList';
import styles from './index.module.scss';

interface Props {
  items: ImageFile[];
  onOpen?: (itemIds: string[]) => void;
  actions?: JSX.Element;
  selectionActions?: (selection: ImageFile[]) => JSX.Element;
  className?: string;
}

export const FileManager: React.FC<Props> = ({
  items,
  onOpen,
  actions,
  selectionActions,
  className,
}) => {
  const [selection, setSelection] = useState<string[]>([]);

  return (
    <div className={clsx(styles.manager, className)}>
      <div className={styles.actions}>
        {actions}
        {selection.length > 0 && (
          <>
            {!!actions && <div className={styles.separator} />}
            {selectionActions?.(
              selection
                .map(name => items.find(item => item.name === name))
                .filter(item => !!item) as ImageFile[],
            )}
          </>
        )}
      </div>
      {items.length ? (
        <FileList
          items={items}
          onOpen={onOpen}
          selection={selection}
          onSelect={setSelection}
        />
      ) : (
        <div className={styles.info}>No files of this type are available.</div>
      )}
    </div>
  );
};
