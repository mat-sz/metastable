import React from 'react';

import { Status as StatusView } from './common/Status';
import { useMediaQuery } from '../../utils/useMediaQuery';

export const Status: React.FC = () => {
  const isDesktop = useMediaQuery('screen and (min-width: 960px)');
  return isDesktop ? <StatusView /> : null;
};
