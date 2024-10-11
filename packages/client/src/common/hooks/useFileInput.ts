import React from 'react';

import { handleFilesEvent } from '$utils/file';

interface FileInputState {
  open(): void;
}

interface FileInputOptions {
  onFiles?: (files: File[]) => void;
  accept?: string;
}

export function useFileInput({
  onFiles,
  accept,
}: FileInputOptions): FileInputState {
  const [state, setState] = React.useState<FileInputState>({
    open: () => {},
  });

  React.useEffect(() => {
    if (!onFiles) {
      return;
    }

    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.style.opacity = '0.001';
    inputElement.style.position = 'absolute';
    inputElement.style.zIndex = '-100';
    inputElement.style.width = '1px';
    inputElement.style.height = '1px';
    inputElement.multiple = true;
    if (accept) {
      inputElement.accept = accept;
    }
    inputElement.addEventListener('change', e => {
      handleFilesEvent(e, onFiles, accept);
      inputElement.value = '';
    });
    document.body.append(inputElement);

    setState({
      open: () => inputElement.click(),
    });

    return () => {
      setState({ open: () => {} });
      inputElement.remove();
    };
  }, [onFiles, setState]);

  return state;
}
