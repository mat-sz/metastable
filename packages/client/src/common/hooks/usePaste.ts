import React from 'react';

import { handleFilesEvent } from '$utils/file';

interface PasteOptions {
  onFiles?: (files: File[]) => void;
  accept?: string;
}

export function usePaste({ onFiles, accept }: PasteOptions) {
  React.useEffect(() => {
    if (!onFiles) {
      return;
    }

    const onPaste = (e: ClipboardEvent) => {
      handleFilesEvent(e, onFiles, accept);
    };

    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('paste', onPaste);
    };
  });
}
