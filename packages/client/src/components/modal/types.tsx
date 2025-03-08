export interface ModalProps {
  title: string;
  size?: 'big' | 'small';
  onSubmit?: (values: any) => void;
  onCancel?: () => void;
}
