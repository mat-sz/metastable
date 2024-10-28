import { observer } from 'mobx-react-lite';
import React from 'react';

import { RequirementsTable } from '$components/requirementsTable';
import { setupStore } from '$stores/SetupStore';

export const Compatibility: React.FC = observer(() => {
  const requirements = setupStore.requirements;

  return <RequirementsTable requirements={requirements} />;
});
