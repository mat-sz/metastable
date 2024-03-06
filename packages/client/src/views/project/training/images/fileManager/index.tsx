import React, { useState } from 'react';

import styles from './index.module.scss';
import { FileManagerItem } from './types';
import { FileList } from './FileList';

interface Props {
  items: FileManagerItem[];
  onOpen?: (itemIds: string[]) => void;
  actions?: JSX.Element;
  selectionActions?: (selection: FileManagerItem[]) => JSX.Element;
}

export const FileManager: React.FC<Props> = ({
  items,
  onOpen,
  actions,
  selectionActions,
}) => {
  const [selection, setSelection] = useState<string[]>([]);

  return (
    <div className={styles.manager}>
      <div className={styles.actions}>
        {actions}
        {selection.length > 0 && (
          <>
            {!!actions && <div className={styles.separator} />}
            {selectionActions?.(
              selection
                .map(id => items.find(item => item.id === id))
                .filter(item => !!item) as FileManagerItem[],
            )}
          </>
        )}
      </div>
      <FileList
        items={items}
        onOpen={onOpen}
        selection={selection}
        onSelect={setSelection}
      />
    </div>
  );
};
