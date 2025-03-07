export type AlignTo =
  | 'above'
  | 'auto-cursor'
  | 'auto-target'
  | 'below'
  | 'left'
  | 'right';

export type Rect = Omit<DOMRect, 'toJSON'>;

export interface PopoverStyle {
  left: number;
  top: number;
  width?: number;
  height?: number;
}

export interface PopoverOptions {
  alignTo?: AlignTo;
  className?: string;
  dataTestId?: string;
  dataTestName?: string;
  onHide?: () => void | Promise<void>;
  onShow?: (event?: React.SyntheticEvent) => void | Promise<void>;
  style?: React.CSSProperties;
  noBackdrop?: boolean;
}

export interface PopoverShowOptions {
  positioningTarget: HTMLElement | React.SyntheticEvent;
  focusTarget?: HTMLElement | null;
}
