import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './VarBase.module.scss';

export interface IVarBaseProps {
  /**
   * Label to be shown left to the input.
   */
  label?: ReactNode;

  /**
   * Additional class names on the wrapping div element.
   */
  className?: string;

  /**
   * Should the component be disabled.
   */
  disabled?: boolean;

  /**
   * Should the component be read-only.
   */
  readOnly?: boolean;

  /**
   * Children. Only rendered when provided directly to the VarBase component.
   */
  children?: ReactNode;

  /**
   * Should keep children in a column, with every child having a width of 100%.
   */
  column?: boolean;

  /**
   * Error to display.
   */
  error?: string;

  inline?: boolean;
}

export interface IVarBaseValueProps<T> {
  /**
   * Variable path in the data object.
   */
  path?: string;

  /**
   * Current value (only used if context and path aren't available).
   * In most cases you aren't going to need this.
   */
  value?: T;

  /**
   * Default value for components that support resetting (on double click for example).
   */
  defaultValue?: T;

  /**
   * On change event, called with the new value if provided.
   * In most cases you aren't going to need this.
   */
  onChange?: (value: T) => void;

  /**
   * Error path to resolve in object. (default: same as path)
   */
  errorPath?: string;

  error?: string;
}

export interface IVarBaseInputProps<T>
  extends IVarBaseProps,
    IVarBaseValueProps<T> {}

/**
 * Base VarUI input component. Doesn't do anything besides displaying the label.
 * Used to construct other components from.
 */
export const VarBase = ({
  label,
  children,
  className,
  error,
  inline,
}: IVarBaseProps): JSX.Element => {
  return (
    <div
      className={clsx(styles.label, { [styles.inline]: inline }, className)}
      varui-label=""
    >
      <div className={styles.title} varui-label-title="">
        {label}
      </div>
      <div varui-label-body="">{children}</div>
      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  );
};
