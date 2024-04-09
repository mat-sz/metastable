import { Model, ModelType } from '@metastable/types';
import React, { useEffect, useState } from 'react';

import { TRPC } from '$api';
import { Modal, useModal } from '$components/modal';
import { VarString, VarUI } from '$components/var';

interface Props {
  type: ModelType;
  name: string;
}

export const ModelEdit: React.FC<Props> = ({ type, name }) => {
  const { close } = useModal();
  const [metadata, setMetadata] = useState<Model['metadata']>();

  const metadataQuery = TRPC.model.get.useQuery({
    type,
    name,
  });
  const metadataMutation = TRPC.model.update.useMutation();

  useEffect(() => {
    if (metadataQuery.data) {
      setMetadata(metadataQuery.data.metadata);
    }
  }, [metadataQuery.data, setMetadata]);

  if (!metadataQuery.data) {
    return <div>Loading...</div>;
  }

  return (
    <Modal title="Update model" size="small">
      <div>
        <VarUI onChange={setMetadata} values={metadata!}>
          <VarString
            readOnly
            value={metadataQuery.data.file.name}
            label="Filename"
          />
          <VarString path="name" label="Display name" />
          <VarString
            path="description"
            label="Description"
            autoexpand
            multiline
          />
        </VarUI>
      </div>
      <button
        onClick={() => {
          metadataMutation.mutate({ name, type, metadata });
          close();
        }}
      >
        Save
      </button>
    </Modal>
  );
};
