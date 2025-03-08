import { ReactNode, useState } from 'react';

import { Button } from '$components/button';
import { Modal, ModalActions } from '$components/modal';
import { useModalWrapperContext } from '$hooks/useModal';
import { IVarArrayProps, VarArray } from './VarArray';
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

export interface IVarArrayWithModalProps<T = any>
  extends Omit<
    IVarArrayProps<T>,
    'label' | 'children' | 'readOnly' | 'children' | 'footer'
  > {
  addModalTitle?: string;
  editModalTitle?: string;
  modalChildren?: ReactNode;
  children?: (context: VarArrayWithModalItemContext<T>) => ReactNode;
  footer?: (context: VarArrayWithModalFooterContext<T>) => ReactNode;
  getEmptyObject?: () => T;
  onValidate?: (context: VarArrayWithModalValidateContext<T>) => Promise<T> | T;
}

interface ItemModalProps {
  title: string;
  initialData?: any;
  onSave: (data: any) => void;
  primaryButtonLabel?: string;
  onValidate?: (data: any) => Promise<any> | any;
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

  return (
    <Modal
      title={title}
      size="small"
      onSubmit={async () => {
        if (onValidate) {
          setIsValidating(true);
          onSave({ ...(await onValidate(data)) });
          setIsValidating(false);
        } else {
          onSave({ ...data });
        }
      }}
    >
      <VarUI values={data} onChange={setData}>
        {children}
      </VarUI>
      <ModalActions>
        <Button disabled={isValidating} variant="primary">
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
  const modalWrapper = useModalWrapperContext();

  return (
    <VarArray
      {...props}
      footer={({ append, array }) =>
        footer?.({
          array,
          add: () => {
            modalWrapper.open(
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
            modalWrapper.open(
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
