import React, { useEffect, useState } from 'react';
import { BsArrow90DegUp } from 'react-icons/bs';

import { useEditor } from './context';
import { ResetColorsIcon } from './icons/ResetColors';
import styles from './index.module.scss';

export const Colors: React.FC = () => {
  const editor = useEditor();

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
    <div className={styles.colors}>
      <input
        type="color"
        value={foregroundColor}
        onChange={e => (editor.foregroundColor = e.target.value)}
        className={styles.foreground}
      />
      <input
        type="color"
        value={backgroundColor}
        onChange={e => (editor.backgroundColor = e.target.value)}
        className={styles.background}
      />
      <button
        className={styles.reset}
        title="Reset colors"
        onClick={() => {
          editor.foregroundColor = '#000000';
          editor.backgroundColor = '#ffffff';
        }}
      >
        <ResetColorsIcon />
      </button>
      <button
        className={styles.swap}
        title="Swap colors"
        onClick={() => {
          const foregroundColor = editor.foregroundColor;
          editor.foregroundColor = editor.backgroundColor;
          editor.backgroundColor = foregroundColor;
        }}
      >
        <BsArrow90DegUp />
      </button>
    </div>
  );
};
