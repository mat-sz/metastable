import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../stores/MainStore';
import { Step1 } from './Step1';
import { Step2 } from './Step2';

export const Setup: React.FC = observer(() => {
  if (mainStore.setup.status?.status == 'in_progress') {
    return <Step2 />;
  } else {
    return <Step1 />;
  }
});
