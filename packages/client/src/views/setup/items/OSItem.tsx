import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsQuestion } from 'react-icons/bs';
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa';

import { RequirementsTable } from '$components/requirementsTable';
import { setupStore } from '$stores/SetupStore';
import { Item } from '../components/Item';

const ICONS: Record<string, React.ReactNode> = {
  win32: <FaWindows />,
  darwin: <FaApple />,
  linux: <FaLinux />,
};

export const OSItem: React.FC = observer(() => {
  const details = setupStore.details!;
  const item = setupStore.os;

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
