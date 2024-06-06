import { observer } from 'mobx-react-lite';
import React from 'react';

import { mainStore } from '$stores/MainStore';
import { Checking } from './Checking';
import { ConnectionError } from './ConnectionError';
import { OutOfDate } from './OutOfDate';
import { Step1 } from './Step1';
import { Step2 } from './Step2';

export const Setup: React.FC = observer(() => {
  if (!mainStore.updateInfoReady) {
    return <Checking />;
  } else if (!mainStore.updateInfo.latestVersion) {
    return <ConnectionError />;
  } else if (!mainStore.updateInfo.isUpToDate) {
    return <OutOfDate />;
  }

  if (mainStore.setup.status?.status == 'in_progress') {
    return <Step2 />;
  } else {
    return <Step1 />;
  }
});
