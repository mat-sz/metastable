import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { BsList, BsXLg } from 'react-icons/bs';

import styles from './Header.module.scss';
import { Menu } from '../common/Menu';
import { Status } from '../common/Status';

export const Header: React.FC = observer(() => {
  const [isOpen, setOpen] = useState(false);

  return (
    <div className={styles.header}>
      <div>
        <button
          onClick={() => setOpen(current => !current)}
          title="Open menu"
          className={clsx(styles.toggle, { [styles.open]: isOpen })}
        >
          <BsList />
        </button>
      </div>
      <div
        className={clsx(styles.menu, { [styles.open]: isOpen })}
        onClick={() => setOpen(false)}
      >
        <button
          onClick={() => setOpen(false)}
          title="Close menu"
          className={styles.toggle}
        >
          <BsXLg />
        </button>
        <div className={styles.main}>
          <Menu />
          <Status className={styles.status} />
        </div>
      </div>
      <div className={styles.title}>
        <h1>Metastable</h1>
      </div>
    </div>
  );
});
