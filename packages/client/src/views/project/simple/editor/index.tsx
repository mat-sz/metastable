import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';

import { Editor } from '$editor';
import { Actions } from './Actions';
import { EditorContext } from './context';
import styles from './index.module.scss';
import { Layers } from './Layers';
import { ProjectActions } from './ProjectActions';
import { Tools } from './Tools';
import { ToolSettings } from './ToolSettings';
import { useSimpleProject } from '../../context';
import { Settings } from '../settings';

export const ImageEditor: React.FC = observer(() => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const project = useSimpleProject();

  if (!project.editor) {
    project.editor = new Editor();
  }
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
        <Settings actions={<Actions />} showPrompt />
      </div>
    </EditorContext.Provider>
  );
});

export default ImageEditor;
