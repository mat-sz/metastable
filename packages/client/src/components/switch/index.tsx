import clsx from 'clsx';
import React from 'react';

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

interface SwitchOptionDetailsProps {
  value: string;
  icon?: React.ReactNode;
  name?: string;
  description?: string;
}

export const SwitchOptionDetails: React.FC<SwitchOptionDetailsProps> = ({
  value,
  icon,
  name,
  description,
}) => {
  const context = React.useContext(SwitchContext);

  return (
    <button
      className={clsx(styles.option, styles.details, {
        [styles.active]: value === context.value,
      })}
      onClick={() => context.onChange(value)}
    >
      {icon}
      <span className={styles.name}>{name}</span>
      <span className={styles.description}>{description}</span>
    </button>
  );
};

interface SwitchProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
}

export const Switch: React.FC<React.PropsWithChildren<SwitchProps>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <SwitchContext.Provider value={props}>
      <div className={clsx(styles.switch, className)}>{children}</div>
    </SwitchContext.Provider>
  );
};
