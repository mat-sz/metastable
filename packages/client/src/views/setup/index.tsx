import { observer } from 'mobx-react-lite';
import React from 'react';

import { useUpdateStore } from '$store/update';
import { setupStore } from '$stores/SetupStore';
import { Checking } from './Checking';
import { ConnectionError } from './ConnectionError';
import { OutOfDate } from './OutOfDate';
import { Step1 } from './Step1';
import { Step2 } from './Step2';

export const Setup: React.FC = observer(() => {
  const ready = useUpdateStore(state => state.ready);
  const info = useUpdateStore(state => state.info);

  if (!ready) {
    return <Checking />;
  } else if (!info.latestVersion) {
    return <ConnectionError />;
  } else if (!info.isUpToDate) {
    return <OutOfDate />;
  }

  if (setupStore.status == 'in_progress') {
    return <Step2 />;
  } else {
    return <Step1 />;
  }
});

export default Setup;
