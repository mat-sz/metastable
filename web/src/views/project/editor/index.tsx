import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { Settings } from '../settings';
import { Tools } from './Tools';
import { Layers } from './Layers';
import { Actions } from './Actions';
import { ToolSettings } from './ToolSettings';

export const ImageEditor: React.FC = observer(() => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editor = mainStore.project!.editor;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = editor.glueCanvas.canvas;
    if (!wrapper) {
      return;
    }

    wrapper.append(canvas);

    return () => {
      wrapper.removeChild(canvas);
    };
  }, [editor]);

  return (
    <div className={styles.main}>
      <div className={styles.editor}>
        <ToolSettings editor={editor} />
        <Tools editor={editor} />
        <div className={styles.wrapper} ref={wrapperRef}></div>
        <Layers editor={editor} />
      </div>
      <Settings actions={<Actions editor={editor} />} />
    </div>
  );
});
