import React from 'react';

interface FileInputState {
  open(): void;
}

export function useFileInput(
  onFiles?: (files: File[]) => void,
): FileInputState {
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
    inputElement.accept = 'image/*';
    inputElement.addEventListener('change', () => {
      if (inputElement.files) {
        onFiles([...inputElement.files]);
      }
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
