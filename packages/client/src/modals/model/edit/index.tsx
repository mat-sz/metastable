import { Model } from '@metastable/types';
import React, { useEffect, useState } from 'react';

import { TRPC } from '$api';
import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { VarString, VarUI } from '$components/var';

interface Props {
  mrn: string;
}

export const ModelEdit: React.FC<Props> = ({ mrn }) => {
  const [metadata, setMetadata] = useState<Model['metadata']>();

  const metadataQuery = TRPC.model.get.useQuery({
    mrn,
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
    <Modal
      title="Update model"
      size="small"
      onSubmit={() => {
        metadataMutation.mutate({ mrn, metadata });
      }}
    >
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
      <ModalActions>
        <Button variant="primary">Save</Button>
      </ModalActions>
    </Modal>
  );
};
