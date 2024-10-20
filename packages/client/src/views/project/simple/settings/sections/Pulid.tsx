import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';

import {
  VarCategory,
  VarImageMode,
  VarModel,
  VarSlider,
  VarToggle,
} from '$components/var';
import { useSimpleProject } from '../../../context';
import { VarProjectImage } from '../../common/VarProjectImage';

export const Pulid: React.FC = observer(() => {
  const project = useSimpleProject();

  return (
    <VarCategory label="PuLID">
      <VarToggle label="Enable" path="pulid.enabled" />
      {project.settings.pulid?.enabled && (
        <>
          <VarModel path="pulid.name" modelType={ModelType.IPADAPTER} />
          <VarSlider
            label="Strength"
            path="pulid.strength"
            min={0}
            max={1}
            step={0.01}
            defaultValue={1}
            showInput
          />
          <VarProjectImage label="Image" path="pulid.image" />
          <VarImageMode label="Image mode" path="pulid.imageMode" />
        </>
      )}
    </VarCategory>
  );
});
