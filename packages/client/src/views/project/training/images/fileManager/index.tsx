import { ImageFile } from '@metastable/types';
import React, { useState } from 'react';

import { FileList } from './FileList';
import styles from './index.module.scss';

interface Props {
  items: ImageFile[];
  onOpen?: (itemIds: string[]) => void;
  actions?: JSX.Element;
  selectionActions?: (selection: ImageFile[]) => JSX.Element;
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
                .map(name => items.find(item => item.name === name))
                .filter(item => !!item) as ImageFile[],
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
