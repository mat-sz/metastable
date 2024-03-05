import React from 'react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';
import { BsQuestion } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';

import { RequirementsTable } from '$components/requirementsTable';
import { mainStore } from '$stores/MainStore';
import { Item } from '../components/Item';

const ICONS: Record<string, React.ReactNode> = {
  win32: <FaWindows />,
  darwin: <FaApple />,
  linux: <FaLinux />,
};

export const OSItem: React.FC = observer(() => {
  const details = mainStore.setup.details!;
  const item = mainStore.setup.os;

  return (
    <Item
      id="os"
      icon={ICONS[details.os.platform.value] || <BsQuestion />}
      title="Operating System"
      description={item.description}
      status={item.status}
    >
      <RequirementsTable requirements={item.requirements} />
    </Item>
  );
});
