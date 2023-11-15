import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarCategory, VarSlider } from 'react-var-ui';

export const Input: React.FC = observer(() => {
  return (
    <VarCategory label="Latent">
      <VarSlider
        label="Width"
        path="input.width"
        min={64}
        max={2048}
        step={8}
        defaultValue={512}
        showInput
      />
      <VarSlider
        label="Height"
        path="input.height"
        min={64}
        max={2048}
        step={8}
        defaultValue={512}
        showInput
      />
      <VarSlider
        label="Batch size"
        path="input.batch_size"
        min={1}
        max={16}
        step={1}
        defaultValue={1}
        showInput
      />
    </VarCategory>
  );
});
