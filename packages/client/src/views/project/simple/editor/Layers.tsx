import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { BsImage, BsPlus } from 'react-icons/bs';
import { useContextMenu, ContextMenuItem } from 'use-context-menu';

import { IconButton } from '$components/iconButton';
import type { Layer } from '$editor/types';
import styles from './index.module.scss';
import { useEditor } from './context';

export interface LayerProps {
  layer: Layer;
}

export const LayerItem: React.FC<LayerProps> = ({ layer }) => {
  const editor = useEditor();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { contextMenu, onContextMenu, onKeyDown } = useContextMenu(
    <>
      <ContextMenuItem onSelect={() => editor.duplicateLayer(layer.id)}>
        Duplicate layer
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => editor.deleteLayer(layer.id)}>
        Remove layer
      </ContextMenuItem>
    </>,
  );

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
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      className={clsx(styles.layer, {
        [styles.active]: editor.state.currentLayerId === layer.id,
      })}
    >
      <div className={styles.preview} ref={wrapperRef} />
      <span>{layer.name}</span>
      {contextMenu}
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

    const onPaste = async (e: ClipboardEvent) => {
      const element = e.target as HTMLElement;
      if (
        document.body.contains(element) &&
        (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT')
      ) {
        return;
      }

      for (let item of e.clipboardData!.items) {
        const file = item.getAsFile();

        if (file?.type.startsWith('image/')) {
          editor.addImage(URL.createObjectURL(file), { name: file.name });
        }
      }
    };

    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('paste', onPaste);
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
