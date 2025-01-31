import React, { useEffect, useMemo, useRef } from 'react';

import { ConnectableElement, FactoryOrInstance, ObjectOrRef } from './types';

export function getInstance<T>(factoryOrInstance: FactoryOrInstance<T>): T {
  return typeof factoryOrInstance === 'function'
    ? (factoryOrInstance as () => T)()
    : factoryOrInstance;
}

export function useInstance<T>(
  factoryOrInstance: FactoryOrInstance<T>,
  deps?: React.DependencyList,
): T {
  const memoDeps = [...(deps || [])];
  if (deps == null && typeof factoryOrInstance !== 'function') {
    memoDeps.push(factoryOrInstance);
  }
  return React.useMemo<T>(() => getInstance(factoryOrInstance), memoDeps);
}

export function getElement(
  ref: ObjectOrRef<ConnectableElement>,
): ConnectableElement | undefined {
  if (!ref) {
    return undefined;
  }

  if ('current' in ref) {
    return ref.current ?? undefined;
  }

  return ref;
}

export function useMemoRef<T>(factory: () => T, deps?: React.DependencyList) {
  const memoized = useMemo(factory, deps ?? []);
  const ref = useRef(memoized);

  useEffect(() => {
    ref.current = memoized;
  }, [memoized]);

  return ref;
}

export function attachEvents(
  el: HTMLElement,
  eventsRef: React.RefObject<Record<string, (e: any) => void>>,
) {
  const wrappedEvents = Object.fromEntries(
    Object.keys(eventsRef.current!).map(name => [
      name,
      (e: any) => eventsRef.current![name](e),
    ]),
  );

  for (const [name, callback] of Object.entries(wrappedEvents)) {
    el.addEventListener(name, callback);
  }

  return () => {
    for (const [name, callback] of Object.entries(wrappedEvents)) {
      el.removeEventListener(name, callback);
    }
  };
}

export function useConnectFunction(
  eventsRef: React.RefObject<Record<string, (e: any) => void>>,
  attribute?: string,
) {
  const disconnectRef = useRef<() => void>();
  const currentRef = useRef<ConnectableElement | undefined>(undefined);

  useEffect(() => {
    return () => disconnectRef.current?.();
  }, []);

  return (ref: ObjectOrRef<ConnectableElement>) => {
    const el = getElement(ref);
    if (currentRef.current === el) {
      return ref;
    }

    disconnectRef.current?.();
    currentRef.current = el;

    if (!el) {
      return ref;
    }

    const disconnect = attachEvents(el, eventsRef);
    if (attribute) {
      el.setAttribute(attribute, 'true');
    }

    disconnectRef.current = () => {
      if (attribute) {
        el.removeAttribute(attribute);
      }
      disconnect();
    };

    return ref;
  };
}
