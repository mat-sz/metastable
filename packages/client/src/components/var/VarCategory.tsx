import clsx from 'clsx';
import React, { ReactNode, useState } from 'react';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';

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
}: IVarCategoryProps): JSX.Element => {
  const [isCollapsed, setCollapsed] = useState(false);

  return (
    <div className={clsx(styles.category, className)}>
      <div className={styles.title}>
        {label}
        {collapsible && (
          <button
            title={isCollapsed ? 'Expand' : 'Collapse'}
            className={styles.collapse}
            onClick={() => setCollapsed(isCollapsed => !isCollapsed)}
          >
            {isCollapsed ? <BsChevronDown /> : <BsChevronUp />}
          </button>
        )}
      </div>
      {(!collapsible || !isCollapsed) && <div>{children}</div>}
    </div>
  );
};
