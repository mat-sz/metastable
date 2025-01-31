import React, { ComponentType, LazyExoticComponent } from 'react';

export function lazyPreload<T extends ComponentType<any>>(
  load: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  const promise = load();
  return React.lazy(() => promise);
}
