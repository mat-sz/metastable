import React from 'react';

import { ModalWrapperContext } from '../contexts/ModalWrapperContext';

export function useModalWrapperContext() {
  return React.useContext(ModalWrapperContext);
}
