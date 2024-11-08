import clsx from 'clsx';
import React, { ReactNode, useState } from 'react';
import { BsChevronDown, BsChevronLeft } from 'react-icons/bs';

import styles from './VarCategory.module.scss';

export interface IVarCategoryProps {
  /**
   * Category label.
   */
  label: ReactNode;

  /**
   * Additional class names on the wrapping div element.
   */
  className?: string;

  /**
   * Allows the category to be collapsed if true.
   */
  collapsible?: boolean;

  collapsed?: boolean;

  onToggleCollapsed?: () => void;

  defaultCollapsed?: boolean;

  forceBorder?: boolean;

  children?: React.ReactNode;
}

/**
 * Category component for grouping inputs.
 */
export const VarCategory = ({
  label,
  className,
  children,
  collapsible,
  defaultCollapsed = false,
  forceBorder,
  collapsed,
  onToggleCollapsed,
}: IVarCategoryProps): JSX.Element => {
  const [isCollapsed, setCollapsed] = useState(defaultCollapsed);
  const collapsedState = collapsed ?? isCollapsed;

  return (
    <div
      varui-category=""
      className={clsx(
        styles.category,
        {
          [styles.collapsible]: collapsible,
          [styles.forceBorder]: forceBorder,
        },
        className,
      )}
    >
      <div
        className={styles.title}
        varui-category-title=""
        onClick={() => {
          if (collapsible) {
            if (onToggleCollapsed) {
              onToggleCollapsed();
            } else {
              setCollapsed(isCollapsed => !isCollapsed);
            }
          }
        }}
      >
        {label}
        {collapsible && (
          <span className={styles.collapse}>
            {collapsedState ? <BsChevronLeft /> : <BsChevronDown />}
          </span>
        )}
      </div>
      {(!collapsible || !collapsedState) && (
        <div varui-category-body="">{children}</div>
      )}
    </div>
  );
};
