import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { ModalWrapperContext } from '../contexts/ModalWrapperContext';

export function useModal<T extends Array<any> = any>(
  body: JSX.Element | ((...args: T) => JSX.Element),
): {
  show(...args: T): void;
  hide(): void;
} {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef(body);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperContext = useContext(ModalWrapperContext);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, [isOpen]);

  useEffect(() => {
    bodyRef.current = body;
  }, [body]);

  const show = useCallback(
    (...args: T) => {
      const body =
        typeof bodyRef.current === 'function'
          ? bodyRef.current(...args)
          : bodyRef.current;
      wrapperContext.open(id, body);
      setIsOpen(true);
    },
    [id, setIsOpen],
  );

  const hide = useCallback(() => {
    wrapperContext.close(id);
    setIsOpen(false);
  }, [id, setIsOpen]);

  return { show, hide };
}

export function useModalCondition(
  body: JSX.Element,
  condition: () => boolean,
  deps: React.DependencyList,
) {
  const { show, hide } = useModal(body);

  useEffect(() => {
    if (condition()) {
      show();
      return hide;
    }
  }, [deps, show, hide]);
}
