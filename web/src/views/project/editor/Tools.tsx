import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';
import type { Editor } from './src';
import { Colors } from './Colors';
import { BsBrush, BsCursor, BsEraser } from 'react-icons/bs';
import { PiSelectionLight } from 'react-icons/pi';

export interface ToolsProps {
  editor: Editor;
}

const toolIcons: Record<string, JSX.Element> = {
  move: <BsCursor />,
  brush: <BsBrush />,
  eraser: <BsEraser />,
  select: <PiSelectionLight />,
};

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
          title={tool.name}
        >
          {toolIcons[tool.id]}
        </button>
      ))}
      <Colors editor={editor} />
    </div>
  );
};
