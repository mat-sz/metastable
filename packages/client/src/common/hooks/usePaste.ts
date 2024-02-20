import React from 'react';

export function usePaste(onFiles?: (files: File[]) => void) {
  React.useEffect(() => {
    if (!onFiles) {
      return;
    }

    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) {
        return;
      }

      const files = [...e.clipboardData.items]
        .map(item => item.getAsFile())
        .filter(item => !!item) as File[];

      if (files.length === 0) {
        return;
      }

      onFiles(files);
    };

    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('paste', onPaste);
    };
  });
}
