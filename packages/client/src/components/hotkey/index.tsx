import React from 'react';
import { BsAlt, BsChevronUp, BsCommand } from 'react-icons/bs';

import { parseHotkey } from '$hooks/useHotkey';
import { IS_MAC } from '$utils/config';
import { uppercaseFirst } from '$utils/string';
import styles from './index.module.scss';

export const Hotkey: React.FC<{ keys?: string }> = ({ keys }) => {
  const parsed = keys ? parseHotkey(keys) : undefined;

  return (
    <div className={styles.hotkey}>
      {parsed && (
        <>
          {parsed.ctrl && <kbd>{IS_MAC ? <BsChevronUp /> : 'Ctrl'}</kbd>}
          {parsed.meta && <kbd>{IS_MAC ? <BsCommand /> : 'Super'}</kbd>}
          {parsed.shift && <kbd>Shift</kbd>}
          {parsed.alt && <kbd>{IS_MAC ? <BsAlt /> : 'Alt'}</kbd>}
          {parsed.keys?.map((key, i) => (
            <kbd key={i}>{uppercaseFirst(key)}</kbd>
          ))}
        </>
      )}
      {!parsed && <>(Not set)</>}
    </div>
  );
};
