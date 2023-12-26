import React, { useState } from 'react';

import styles from './List.module.scss';
import { ListContext } from './ListContext';

interface Props {
  hint?: string;
}

export const List: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  hint,
}) => {
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
      {!!hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
};
