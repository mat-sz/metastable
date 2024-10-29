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
import { PromptLoad } from '$modals/promptLoad';
import { modalStore } from '$stores/ModalStore';
import { IS_ELECTRON } from '$utils/config';
import { useSimpleProject } from '../../context';

interface Props {
  type: ProjectFileType;
  file: ImageFile;
}

export const ImageActions: React.FC<Props> = ({ type, file }) => {
  const project = useSimpleProject();

  return (
    <>
      <IconButton
        title="Delete image"
        onClick={() => {
          project.deleteFile(type, file.name);
        }}
      >
        <BsTrashFill />
      </IconButton>
      <IconButton
        title="Use as input image"
        onClick={() => {
          project.useInputImage(file.mrn);
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
            type,
            projectId: project.id,
            name: file.name,
          });
          const settings = data.metadata as any;
          if (settings) {
            modalStore.show(
              <PromptLoad project={project} loadedSettings={settings} />,
            );
          }
        }}
      >
        <BsGearFill />
      </IconButton>
    </>
  );
};
