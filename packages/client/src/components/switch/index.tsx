import React from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';

const SwitchContext = React.createContext<SwitchProps>(undefined as any);

interface SwitchOptionProps {
  value: string;
  title?: string;
}

export const SwitchOption: React.FC<
  React.PropsWithChildren<SwitchOptionProps>
> = ({ value, title, children }) => {
  const context = React.useContext(SwitchContext);

  return (
    <button
      className={clsx(styles.option, {
        [styles.active]: value === context.value,
      })}
      title={title}
      onClick={() => context.onChange(value)}
    >
      {children}
    </button>
  );
};

interface SwitchProps {
  value: string;
  onChange: (value: string) => void;
}

export const Switch: React.FC<React.PropsWithChildren<SwitchProps>> = ({
  children,
  ...props
}) => {
  return (
    <SwitchContext.Provider value={props}>
      <div className={styles.switch}>{children}</div>
    </SwitchContext.Provider>
  );
};
