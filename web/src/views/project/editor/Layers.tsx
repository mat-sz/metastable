import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import styles from './index.module.scss';
import type { Editor } from './src';
import type { Layer } from './src/types';

export interface LayersProps {
  editor: Editor;
}

export interface LayerProps {
  editor: Editor;
  layer: Layer;
}

export const LayerItem: React.FC<LayerProps> = ({ editor, layer }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    wrapper.append(layer.canvas);

    return () => {
      wrapper.removeChild(layer.canvas);
    };
  }, [layer]);

  return (
    <div
      key={layer.id}
      onClick={() => editor.selectLayer(layer.id)}
      className={clsx(styles.layer, {
        [styles.active]: editor.state.currentLayerId === layer.id,
      })}
    >
      <div className={styles.preview} ref={wrapperRef} />
      <span>{layer.name}</span>
    </div>
  );
};

export const Layers: React.FC<LayersProps> = ({ editor }) => {
  const [editorState, setEditorState] = useState(editor.state);

  useEffect(() => {
    const onState = () => {
      setEditorState({ ...editor.state });
    };
    editor.on('state', onState);

    return () => {
      editor.off('state', onState);
    };
  }, [editor, setEditorState]);

  return (
    <div className={styles.layers}>
      {editorState.layers.map(layer => (
        <LayerItem key={layer.id} layer={layer} editor={editor} />
      ))}
      <button onClick={() => editor.emptyLayer()}>Add layer</button>
      <input
        type="file"
        accept="*.jpg, *.jpeg, *.png"
        className={styles.fileInput}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            e.target.value = '';
            editor.addImage(URL.createObjectURL(file), { name: file.name });
          }
        }}
      />
    </div>
  );
};
