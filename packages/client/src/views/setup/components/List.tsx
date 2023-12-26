import React, { useState } from 'react';

import styles from './List.module.scss';
import { ListContext } from './ListContext';

export const List: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState<string>();
  return (
    <div className={styles.list}>
      <ListContext.Provider
        value={{
          open,
          toggle: id => setOpen(current => (current === id ? undefined : id)),
        }}
      >
        {children}
      </ListContext.Provider>
      <div className={styles.hint}>
        Click on an item to reveal more options.
      </div>
    </div>
  );
};
