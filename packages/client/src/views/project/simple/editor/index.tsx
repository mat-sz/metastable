import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import styles from './index.module.scss';
import { Settings } from '../settings';
import { Tools } from './Tools';
import { Layers } from './Layers';
import { Actions } from './Actions';
import { ToolSettings } from './ToolSettings';
import { EditorContext } from './context';
import { ProjectActions } from './ProjectActions';
import { useSimpleProject } from '../../context';

export const ImageEditor: React.FC = observer(() => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const project = useSimpleProject();
  const editor = project.editor;

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
