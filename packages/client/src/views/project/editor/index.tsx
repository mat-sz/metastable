import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { mainStore } from '../../../stores/MainStore';
import { Settings } from '../settings';
import { Tools } from './Tools';
import { Layers } from './Layers';
import { Actions } from './Actions';
import { ToolSettings } from './ToolSettings';
import { EditorContext } from './context';
import { ProjectActions } from './ProjectActions';

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
    <EditorContext.Provider value={editor}>
      <div className={styles.main}>
        <div className={styles.editor}>
          <ToolSettings />
          <ProjectActions />
          <Tools />
          <div className={styles.wrapper} ref={wrapperRef}></div>
          <Layers />
        </div>
        <Settings actions={<Actions />} />
      </div>
    </EditorContext.Provider>
  );
});
