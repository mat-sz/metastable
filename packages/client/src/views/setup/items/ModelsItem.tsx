import React from 'react';
import { observer } from 'mobx-react-lite';

import { Item } from '../components/Item';
import { BsBoxFill } from 'react-icons/bs';

export const ModelsItem: React.FC = observer(() => {
  return (
    <Item
      id="models"
      icon={<BsBoxFill />}
      title="Models"
      description="Select models to download and install."
      status="incomplete"
    />
  );
});
