import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { ReactNode } from 'react';

import { VarCategory } from '$components/var';
import { useSimpleProject } from '../../context';

export interface Props {
  /**
   * Category label.
   */
  label: ReactNode;

  /**
   * Additional class names on the wrapping div element.
   */
  className?: string;

  sectionId: string;

  children?: React.ReactNode;

  defaultCollapsed?: boolean;
}

/**
 * Category component for grouping inputs.
 */
export const SettingsCategory = observer(
  ({
    label,
    className,
    children,
    sectionId,
    defaultCollapsed = false,
  }: Props): JSX.Element => {
    const project = useSimpleProject();

    const collapsed = project.ui?.collapsed?.[sectionId] ?? defaultCollapsed;
    const onToggle = () => {
      runInAction(() => {
        if (!project.ui.collapsed) {
          project.ui.collapsed = {};
        }

        project.ui.collapsed[sectionId] = !collapsed;
      });
    };

    return (
      <VarCategory
        label={label}
        className={className}
        collapsed={collapsed}
        onToggleCollapsed={onToggle}
        collapsible
      >
        {children}
      </VarCategory>
    );
  },
);
