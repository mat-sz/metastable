import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { BsBrush, BsCursor, BsEraser } from 'react-icons/bs';
import { PiEyedropper, PiPaintBucket, PiSelectionLight } from 'react-icons/pi';

import styles from './index.module.scss';
import { Colors } from './Colors';
import { useEditor } from './context';

const toolIcons: Record<string, JSX.Element> = {
  move: <BsCursor />,
  brush: <BsBrush />,
  eraser: <BsEraser />,
  select: <PiSelectionLight />,
  fill: <PiPaintBucket />,
  eyedropper: <PiEyedropper />,
};

export const Tools: React.FC = () => {
  const editor = useEditor();
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
      <Colors />
    </div>
  );
};
