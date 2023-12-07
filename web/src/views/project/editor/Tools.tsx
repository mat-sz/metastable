import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';
import type { Editor } from './src';
import { Colors } from './Colors';

export interface ToolsProps {
  editor: Editor;
}

export const Tools: React.FC<ToolsProps> = ({ editor }) => {
  const [currentToolId, setCurrentToolId] = useState(editor.currentToolId);

  useEffect(() => {
    const onToolChanged = () => {
      setCurrentToolId(editor.currentToolId);
    };
    editor.on('toolChanged', onToolChanged);

    return () => {
      editor.off('toolChanged', onToolChanged);
    };
  }, [editor, setCurrentToolId]);

  return (
    <div className={styles.tools}>
      {Object.values(editor.tools).map(tool => (
        <button
          key={tool.id}
          onClick={() => {
            editor.selectTool(tool.id);
          }}
          className={clsx({
            [styles.active]: currentToolId === tool.id,
          })}
        >
          {tool.name}
        </button>
      ))}
      <Colors editor={editor} />
    </div>
  );
};
