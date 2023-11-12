import React from 'react';
import { observer } from 'mobx-react-lite';
import { mainStore } from '../../stores/MainStore';

export const Preview: React.FC = observer(() => {
  const project = mainStore.project;

  return (
    <div>
      {project.outputFilenames.map(filename => (
        <img src={project.view('output', filename)} key={filename} />
      ))}
    </div>
  );
});
