import React, { useEffect, useRef } from 'react';

import styles from './index.module.scss';
import { Editor } from './src';
import { Tools } from './Tools';
import { Layers } from './Layers';

export const ImageEditor: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef(new Editor());

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const editor = editorRef.current;
    const canvas = editor.glueCanvas.canvas;
    if (!wrapper) {
      return;
    }

    wrapper.append(canvas);

    return () => {
      wrapper.removeChild(canvas);
    };
  }, []);

  return (
    <div className={styles.editor}>
      <Tools editor={editorRef.current} />
      <div className={styles.wrapper} ref={wrapperRef}></div>
      <Layers editor={editorRef.current} />
    </div>
  );
};
