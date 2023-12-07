import React, { useEffect, useState } from 'react';

import type { Editor } from './src';

export interface ColorsProps {
  editor: Editor;
}

export const Colors: React.FC<ColorsProps> = ({ editor }) => {
  const [foregroundColor, setForegroundColor] = useState(
    editor.foregroundColor,
  );
  const [backgroundColor, setBackgroundColor] = useState(
    editor.backgroundColor,
  );

  useEffect(() => {
    const onForegroundColorChanged = () => {
      setForegroundColor(editor.foregroundColor);
    };
    const onBackgroundColorChanged = () => {
      setBackgroundColor(editor.backgroundColor);
    };
    editor.on('foregroundColorChanged', onForegroundColorChanged);
    editor.on('backgroundColorChanged', onBackgroundColorChanged);

    return () => {
      editor.off('foregroundColorChanged', onForegroundColorChanged);
      editor.off('backgroundColorChanged', onBackgroundColorChanged);
    };
  }, [editor, setForegroundColor, setBackgroundColor]);

  return (
    <div>
      <input
        type="color"
        value={foregroundColor}
        onChange={e => (editor.foregroundColor = e.target.value)}
      />
      <input
        type="color"
        value={backgroundColor}
        onChange={e => (editor.backgroundColor = e.target.value)}
      />
    </div>
  );
};
