import { ModelType } from '@metastable/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { BsX } from 'react-icons/bs';

import { IconButton } from '$components/iconButton';
import {
  VarAddModel,
  VarArray,
  VarCategory,
  VarImageMode,
  VarModel,
  VarSlider,
  VarToggle,
} from '$components/var';
import { VarProjectImage } from './VarProjectImage';
import { useSimpleProject } from '../../context';

interface Props {
  path: string;
  type: ModelType.CONTROLNET | ModelType.IPADAPTER | ModelType.LORA;
  label: string;
  hasImage?: boolean;
  hasClipVision?: boolean;
  strengthMin?: number;
  strengthMax?: number;
}

export const ModelArray: React.FC<Props> = observer(
  ({
    path,
    type,
    label,
    hasImage,
    hasClipVision,
    strengthMin = 0,
    strengthMax = 1,
  }) => {
    const project = useSimpleProject();

    return (
      <>
        <VarArray path={path}>
          {({ remove }) => (
            <VarCategory
              label={
                <>
                  <span>{label}</span>
                  <IconButton title="Delete" onClick={remove}>
                    <BsX />
                  </IconButton>
                </>
              }
            >
              <VarToggle label="Enable" path="enabled" />
              <VarModel
                path="name"
                modelType={type}
                architecture={project.architecture}
              />
              {hasClipVision && (
                <VarModel
                  path="clipVisionName"
                  modelType={ModelType.CLIP_VISION}
                />
              )}
              <VarSlider
                label="Strength"
                path="strength"
                min={strengthMin}
                max={strengthMax}
                step={0.01}
                defaultValue={1}
                showInput
              />
              {hasImage && (
                <>
                  <VarProjectImage label="Image" path="image" />
                  <VarImageMode label="Image mode" path="imageMode" />
                </>
              )}
            </VarCategory>
          )}
        </VarArray>
        <VarAddModel
          label={label}
          modelType={type}
          architecture={project.architecture}
          onSelect={model => {
            project.addModel(type, model.file.name);
          }}
        />
      </>
    );
  },
);
