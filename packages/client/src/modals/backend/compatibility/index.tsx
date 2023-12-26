import React from 'react';
import { observer } from 'mobx-react-lite';

import { mainStore } from '../../../stores/MainStore';
import { RequirementsTable } from '../../../components/requirementsTable';

export const Compatibility: React.FC = observer(() => {
  const requirements = mainStore.setup.requirements;

  return <RequirementsTable requirements={requirements} />;
});
