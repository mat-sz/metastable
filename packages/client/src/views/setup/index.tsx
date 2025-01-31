import { observer } from 'mobx-react-lite';
import React from 'react';

import { setupStore } from '$stores/SetupStore';
import { updateStore } from '$stores/UpdateStore';
import { Checking } from './Checking';
import { ConnectionError } from './ConnectionError';
import { OutOfDate } from './OutOfDate';
import { Step1 } from './Step1';
import { Step2 } from './Step2';

export const Setup: React.FC = observer(() => {
  if (!updateStore.ready) {
    return <Checking />;
  } else if (!updateStore.info.latestVersion) {
    return <ConnectionError />;
  } else if (!updateStore.info.isUpToDate) {
    return <OutOfDate />;
  }

  if (setupStore.status == 'in_progress') {
    return <Step2 />;
  } else {
    return <Step1 />;
  }
});

export default Setup;
