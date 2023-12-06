import React from 'react';
import { observer } from 'mobx-react-lite';
import { VarCategory, VarImage, VarSelect, VarSlider } from 'react-var-ui';
import { mainStore } from '../../../stores/MainStore';

export const Input: React.FC = observer(() => {
  const project = mainStore.project!;

  return (
    <VarCategory label="Input">
      <VarSelect
        label="Mode"
        path="input.mode"
        options={[
          { key: 'empty', label: 'Empty latent image' },
          { key: 'image', label: 'Image' },
          { key: 'image_masked', label: 'Image with mask (inpainting)' },
        ]}
      />
      {project.settings.input.mode === 'empty' ? (
        <>
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
        </>
      ) : (
        <>
          <VarImage label="Image" path="input.image" />
        </>
      )}
    </VarCategory>
  );
});
