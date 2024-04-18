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

  defaultCollapsed?: boolean;

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
}: IVarCategoryProps): JSX.Element => {
  const [isCollapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      varui-category=""
      className={clsx(
        styles.category,
        { [styles.collapsible]: collapsible },
        className,
      )}
    >
      <div
        className={styles.title}
        varui-category-title=""
        onClick={() => {
          if (collapsible) {
            setCollapsed(isCollapsed => !isCollapsed);
          }
        }}
      >
        {label}
        {collapsible && (
          <span className={styles.collapse}>
            {isCollapsed ? <BsChevronLeft /> : <BsChevronDown />}
          </span>
        )}
      </div>
      {(!collapsible || !isCollapsed) && <div>{children}</div>}
    </div>
  );
};
