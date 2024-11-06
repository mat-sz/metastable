import React, { useEffect } from 'react';

import { tryParse } from '$utils/json';

export function useStorage<T>(key: string, defaultValue: T) {
  const initialValue = tryParse(localStorage.getItem(key)) || defaultValue;
  const [state, setState] = React.useState<T>(initialValue);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}
