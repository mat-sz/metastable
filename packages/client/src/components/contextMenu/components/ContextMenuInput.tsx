import clsx from 'clsx';
import { ReactNode, useState } from 'react';

import { IconButton } from '$components/iconButton';
import styles from './ContextMenuInput.module.scss';
import { ContextMenuItem, ContextMenuItemProps } from './ContextMenuItem';

interface ContextMenuInputProps extends Omit<ContextMenuItemProps, 'children'> {
  onSubmit?: (value: string) => void;
  placeholder?: string;
  buttonIcon?: ReactNode;
}

export const ContextMenuInput: React.FC<ContextMenuInputProps> = ({
  className,
  onSubmit,
  placeholder,
  buttonIcon,
  ...props
}) => {
  const [value, setValue] = useState('');

  const onSelect = (event: React.UIEvent) => {
    event.stopPropagation();
  };

  return (
    <ContextMenuItem
      onSelect={onSelect}
      className={clsx(styles.item, className)}
      {...props}
    >
      <form
        className={styles.form}
        onSubmit={e => {
          e.preventDefault();
          onSubmit?.(value);
          setValue('');
        }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          className={styles.input}
        />
        {buttonIcon && (
          <IconButton className={styles.button}>{buttonIcon}</IconButton>
        )}
      </form>
    </ContextMenuItem>
  );
};
