import React from 'react';

import { useFileInput } from '$hooks/useFileInput';
import { usePaste } from '$hooks/usePaste';
import { Dropzone } from './Dropzone';

interface FilePickerState {
  open: () => void;
}

interface Props {
  dropzone?: boolean;
  paste?: boolean;
  onFiles?: (files: File[]) => void;
  children?: (state: FilePickerState) => React.ReactNode;
  accept?: string;
}

export const FilePicker: React.FC<Props> = ({
  dropzone = false,
  paste = false,
  onFiles,
  children,
  accept,
}) => {
  const inputState = useFileInput({ onFiles, accept });
  usePaste(paste ? { onFiles, accept } : {});

  return (
    <>
      {dropzone && <Dropzone onFiles={onFiles} accept={accept} />}
      {children?.(inputState)}
    </>
  );
};
