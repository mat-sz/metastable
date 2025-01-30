export type ConnectableElement = HTMLElement | null;
export type ObjectOrRef<T> = React.RefObject<T> | T | null;
export type ConnectElement = (
  elementOrNode: ObjectOrRef<ConnectableElement>,
) => ObjectOrRef<ConnectableElement>;
export type Identifier = string;
export type FactoryOrInstance<T> = T | (() => T);
