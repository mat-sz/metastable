import React, { useEffect, useRef, useState } from 'react';

import styles from './Dropzone.module.scss';
import { Portal } from '../portal';

interface Props {
  onFiles?: (files: File[]) => void;
}

export const Dropzone: React.FC<Props> = ({ onFiles }) => {
  const [isVisible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<any>();

  const hide = () => {
    setVisible(false);
  };

  const checkDragEvent = (e: React.DragEvent) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(hide, 5000);

    for (const item of e.dataTransfer.items) {
      if (item.kind === 'file') {
        e.dataTransfer.dropEffect = 'copy';
        e.preventDefault();
        return;
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFiles?.(
      [...e.dataTransfer.items]
        .map(item => item.getAsFile())
        .filter(item => !!item) as File[],
    );
    setVisible(false);
  };

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer) {
        setVisible(false);
        return;
      }

      for (const item of e.dataTransfer.items) {
        if (item.kind === 'file') {
          setVisible(true);
          return;
        }
      }

      setVisible(false);
    };

    const preventDefault = (e: Event) => e.preventDefault();

    document.addEventListener('drag', preventDefault);
    document.addEventListener('drop', preventDefault);
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('dragenter', onDragEnter);

    return () => {
      document.removeEventListener('drag', preventDefault);
      document.removeEventListener('drop', preventDefault);
      document.removeEventListener('dragover', preventDefault);
      document.removeEventListener('dragenter', onDragEnter);
    };
  }, []);

  return (
    <Portal isOpen={isVisible}>
      <div
        className={styles.overlay}
        onDragEnter={checkDragEvent}
        onDrag={checkDragEvent}
        onDragLeave={hide}
        onDragEnd={hide}
        onDrop={onDrop}
      >
        <div className={styles.dropzone}>
          <h2>Drop files here to upload them to this space.</h2>
        </div>
      </div>
    </Portal>
  );
};
