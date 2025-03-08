import React from 'react';

import { ModalContext } from '../contexts/ModalContext';

export function useModalContext() {
  return React.useContext(ModalContext);
}
