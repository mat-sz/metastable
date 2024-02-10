import React from 'react';
import { observer } from 'mobx-react-lite';

import { RequirementsTable } from '@components/requirementsTable';
import { mainStore } from '@stores/MainStore';

export const Compatibility: React.FC = observer(() => {
  const requirements = mainStore.setup.requirements;

  return <RequirementsTable requirements={requirements} />;
});
