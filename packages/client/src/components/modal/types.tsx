import { FormDataObject } from '$utils/form';

export interface ModalProps {
  title: string;
  size?: 'big' | 'small';
  onSubmit?: (values: FormDataObject, action?: string) => void | Promise<void>;
}
