import { ReactNode, useState } from 'react';

import { Alert } from '$components/alert';
import { Button } from '$components/button';
import { Modal, ModalActions, useModal } from '$components/modal';
import { modalStore } from '$stores/ModalStore';
import { VarArray } from './VarArray';
import { IVarBaseInputProps } from './VarBase';
import { VarUI } from './VarUI';

interface VarArrayWithModalItemContext<T> {
  element: T;
  index: number;
  array: T[];
  edit(): void;
  remove(): void;
}

interface VarArrayWithModalFooterContext<T> {
  array: T[];
  add(): void;
}

interface VarArrayWithModalValidateContext<T> {
  data: T;
  array: T[];
  index?: number;
}

type ValidationResult = string | undefined;

export interface IVarArrayWithModalProps<T = any>
  extends Omit<IVarBaseInputProps<T[]>, 'label' | 'children' | 'readOnly'> {
  addModalTitle?: string;
  editModalTitle?: string;
  modalChildren?: ReactNode;
  children?: (context: VarArrayWithModalItemContext<T>) => ReactNode;
  footer?: (context: VarArrayWithModalFooterContext<T>) => ReactNode;
  getEmptyObject?: () => T;
  onValidate?: (
    context: VarArrayWithModalValidateContext<T>,
  ) => Promise<ValidationResult> | ValidationResult;
}

interface ItemModalProps {
  title: string;
  initialData?: any;
  onSave: (data: any) => void;
  primaryButtonLabel?: string;
  onValidate?: (data: any) => Promise<ValidationResult> | ValidationResult;
}

const ItemModal = ({
  title,
  children,
  initialData = {},
  onSave,
  primaryButtonLabel = 'Add',
  onValidate,
}: React.PropsWithChildren<ItemModalProps>) => {
  const [data, setData] = useState<any>(initialData);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>();
  const { close } = useModal();

  return (
    <Modal title={title} size="small">
      {!!validationResult && <Alert variant="error">{validationResult}</Alert>}
      <VarUI values={data} onChange={setData}>
        {children}
      </VarUI>
      <ModalActions>
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={isValidating}
          variant="primary"
          onClick={async () => {
            if (onValidate) {
              setIsValidating(true);

              let result: ValidationResult;
              try {
                result = await onValidate(data);
              } catch (e) {
                result = `${e}`;
              }

              setIsValidating(false);
              if (result) {
                setValidationResult(result);
                return;
              }
            }
            onSave({ ...data });
            close();
          }}
        >
          {primaryButtonLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
};

export const VarArrayWithModal = ({
  addModalTitle = 'Add new item',
  editModalTitle = 'Edit item',
  children,
  modalChildren,
  footer,
  getEmptyObject,
  onValidate,
  ...props
}: IVarArrayWithModalProps): JSX.Element => {
  return (
    <VarArray
      {...props}
      footer={({ append, array }) =>
        footer?.({
          array,
          add: () => {
            modalStore.show(
              <ItemModal
                title={addModalTitle}
                onValidate={
                  onValidate ? data => onValidate({ data, array }) : undefined
                }
                initialData={getEmptyObject?.()}
                onSave={append}
                primaryButtonLabel="Add"
              >
                {modalChildren}
              </ItemModal>,
            );
          },
        })
      }
    >
      {({ array, index, remove, update, element }) =>
        children?.({
          array,
          index,
          remove,
          element,
          edit: () =>
            modalStore.show(
              <ItemModal
                title={editModalTitle}
                onValidate={
                  onValidate
                    ? data => onValidate({ data, array, index })
                    : undefined
                }
                initialData={element}
                onSave={update}
                primaryButtonLabel="Save"
              >
                {modalChildren}
              </ItemModal>,
            ),
        })
      }
    </VarArray>
  );
};
