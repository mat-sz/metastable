import React from 'react';

import { IS_MAC } from '../../config';
import { Header as DesktopHeader } from './desktop/Header';
import { Header as MobileHeader } from './mobile/Header';
import { useMediaQuery } from '../../utils/useMediaQuery';

interface Props {
  showMenu?: boolean;
}

export const Header: React.FC<Props> = ({ showMenu = !IS_MAC }) => {
  const isDesktop = useMediaQuery('screen and (min-width: 960px)');
  return isDesktop ? <DesktopHeader showMenu={showMenu} /> : <MobileHeader />;
};
