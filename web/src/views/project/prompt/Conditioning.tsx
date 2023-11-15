import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarCategory, VarString } from 'react-var-ui';

export const Conditioning: React.FC = observer(() => {
  return (
    <VarCategory label="Conditioning">
      <VarString label="Positive" path="conditioning.positive" multiline />
      <VarString label="Negative" path="conditioning.negative" multiline />
    </VarCategory>
  );
});
