import { Checkbox } from '$components/checkbox';
import { ContextMenuItem, ContextMenuItemProps } from './ContextMenuItem';

interface Props extends ContextMenuItemProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export const ContextMenuCheckbox: React.FC<Props> = ({
  value,
  onChange,
  ...props
}) => {
  const onSelect = (event: React.UIEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange?.(!value);
  };

  return (
    <ContextMenuItem
      onSelect={onSelect}
      {...props}
      icon={<Checkbox value={value} onChange={onChange} />}
    />
  );
};
