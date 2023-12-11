import React from 'react';

import styles from './index.module.scss';
import type { Editor } from './src';

export interface ActionsProps {
  editor: Editor;
}

export const ToolSettings: React.FC<ActionsProps> = ({ editor }) => {
  return <div className={styles.toolSettings}></div>;
};
