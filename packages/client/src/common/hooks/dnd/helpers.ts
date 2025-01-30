import React from 'react';

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
