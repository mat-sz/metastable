import { ImageFile, ProjectFileType } from '@metastable/types';
import React from 'react';
import {
  BsArrowRightSquare,
  BsFolder,
  BsGear,
  BsMagic,
  BsTrash,
} from 'react-icons/bs';

import { API } from '$api';
import { IconButton } from '$components/iconButton';
import { ProjectLoadPrompt } from '$modals/project/loadPrompt';
import { ProjectPostprocess } from '$modals/project/postprocess';
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
        <BsTrash />
      </IconButton>
      <IconButton
        title="Use as input image"
        onClick={() => {
          project.useInputImage(file.mrn);
        }}
      >
        <BsArrowRightSquare />
      </IconButton>
      {IS_ELECTRON && (
        <IconButton
          title="Reveal in explorer"
          onClick={() => {
            API.electron.shell.showItemInFolder.mutate(file.mrn);
          }}
        >
          <BsFolder />
        </IconButton>
      )}
      <IconButton
        title="Postprocess image"
        onClick={() => {
          modalStore.show(
            <ProjectPostprocess project={project} imageMrn={file.mrn} />,
          );
        }}
      >
        <BsMagic />
      </IconButton>
      <IconButton
        title="Load settings from current image"
        onClick={async () => {
          const data = await API.project.file.get.query({
            type,
            projectId: project.id,
            name: file.name,
          });
          const settings = data.settings as any;
          if (settings) {
            modalStore.show(
              <ProjectLoadPrompt project={project} loadedSettings={settings} />,
            );
          }
        }}
      >
        <BsGear />
      </IconButton>
    </>
  );
};
