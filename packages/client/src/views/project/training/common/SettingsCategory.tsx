import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { ReactNode } from 'react';

import { VarCategoryScope } from '$components/var';
import { useTrainingProject } from '../../context';

export interface Props {
  /**
   * Category label.
   */
  label: ReactNode;

  /**
   * Additional class names on the wrapping div element.
   */
  className?: string;

  path?: string;

  sectionId: string;

  children?: React.ReactNode;

  defaultCollapsed?: boolean;
}

/**
 * Category component for grouping inputs.
 */
export const SettingsCategory = observer(
  ({ sectionId, defaultCollapsed = false, ...props }: Props): JSX.Element => {
    const project = useTrainingProject();

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
      <VarCategoryScope
        {...props}
        collapsed={collapsed}
        onToggleCollapsed={onToggle}
        collapsible
      />
    );
  },
);
