import { ImageFile, ProjectFileType } from '@metastable/types';
import React from 'react';
import {
  BsArrowRightSquareFill,
  BsFolderFill,
  BsGearFill,
  BsTrashFill,
} from 'react-icons/bs';

import { API } from '$api';
import { IconButton } from '$components/iconButton';
import { IS_ELECTRON } from '$utils/config';
import { useSimpleProject } from '../../context';

interface Props {
  file: ImageFile;
}

export const ImageActions: React.FC<Props> = ({ file }) => {
  const project = useSimpleProject();

  return (
    <>
      <IconButton
        title="Delete image"
        onClick={() => {
          project.deleteFile(ProjectFileType.OUTPUT, file.name);
        }}
      >
        <BsTrashFill />
      </IconButton>
      <IconButton
        title="Use as input image"
        onClick={() => {
          project.useInputImage(file.image.url);
        }}
      >
        <BsArrowRightSquareFill />
      </IconButton>
      {IS_ELECTRON && (
        <IconButton
          title="Reveal in explorer"
          onClick={() => {
            API.electron.shell.showItemInFolder.mutate(file.path);
          }}
        >
          <BsFolderFill />
        </IconButton>
      )}
      <IconButton
        title="Load settings from current image"
        onClick={async () => {
          const data = await API.project.file.get.query({
            type: ProjectFileType.OUTPUT,
            projectId: project.id,
            name: file.name,
          });
          const settings = data.metadata as any;
          if (settings) {
            project.setSettings(settings);
          }
        }}
      >
        <BsGearFill />
      </IconButton>
    </>
  );
};
