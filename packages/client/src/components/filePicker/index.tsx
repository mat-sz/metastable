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
}

export const FilePicker: React.FC<Props> = ({
  dropzone = false,
  paste = false,
  onFiles,
  children,
}) => {
  const inputState = useFileInput(onFiles);
  usePaste(paste ? onFiles : undefined);

  return (
    <>
      {dropzone && <Dropzone onFiles={onFiles} />}
      {children?.(inputState)}
    </>
  );
};
