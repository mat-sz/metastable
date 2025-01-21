import React, { ReactNode } from 'react';

import { IVarBaseValueProps } from './VarBase';
import { IVarCategoryProps, VarCategory } from './VarCategory';
import { VarScope } from './VarScope';

export interface IVarCategoryScopeProps
  extends IVarCategoryProps,
    IVarBaseValueProps<any> {
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
export const VarCategoryScope = ({
  path,
  value,
  onChange,
  error,
  errorPath,
  ...props
}: IVarCategoryScopeProps): JSX.Element => {
  const scopeProps = { path, value, onChange, error, errorPath };

  if (path || value || onChange) {
    return (
      <VarScope {...scopeProps}>
        <VarCategory {...props} />
      </VarScope>
    );
  } else {
    return <VarCategory {...props} />;
  }
};
