import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { BsImage, BsPlus } from 'react-icons/bs';

import styles from './index.module.scss';
import type { Layer } from './src/types';
import { IconButton } from '../../../components/IconButton';
import { useEditor } from './context';

export interface LayerProps {
  layer: Layer;
}

export const LayerItem: React.FC<LayerProps> = ({ layer }) => {
  const editor = useEditor();
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

export const Layers: React.FC = () => {
  const editor = useEditor();
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
      <div className={styles.actions}>
        <IconButton title="Add" onClick={() => editor.emptyLayer()}>
          <BsPlus />
        </IconButton>
        <label className={styles.file}>
          <BsImage />
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
        </label>
      </div>
      {editorState.layers.map(layer => (
        <LayerItem key={layer.id} layer={layer} />
      ))}
    </div>
  );
};
