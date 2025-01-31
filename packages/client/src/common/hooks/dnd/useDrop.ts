import React, { useState } from 'react';

import { useConnectFunction, useInstance, useMemoRef } from './helpers';
import { FactoryOrInstance, Identifier } from './types';

interface DropOptions<TItem = unknown> {
  accept: Identifier | Identifier[];
  drop?: (item: TItem) => void;
  hover?: (item: TItem) => void;
  canDrop?: (item: TItem) => void;
}

export function useDrop<TItem>(
  options: FactoryOrInstance<DropOptions<TItem>>,
  deps?: React.DependencyList,
) {
  const opts = useInstance(options, deps);
  const [isOver, setIsOver] = useState(false);

  const events = useMemoRef(() => {
    const entered: Set<any> = new Set();

    return {
      dragover: (e: DragEvent) => {
        e.preventDefault();
      },
      dragenter: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (entered.size === 0) {
          setIsOver(true);
        }
        if (e.target) {
          entered.add(e.target);
        }
      },
      dragleave: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.target) {
          entered.delete(e.target);
        }
        if (entered.size === 0) {
          setIsOver(false);
        }
      },
      drop: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);

        if (e.dataTransfer) {
          const accept = Array.isArray(opts.accept)
            ? opts.accept
            : [opts.accept];
          for (const type of accept) {
            const data = e.dataTransfer.getData(type);
            try {
              const item = JSON.parse(data);
              opts?.drop?.(item);
            } catch {
              //
            }
          }
        }
      },
    };
  }, [setIsOver, opts]);

  const connect = useConnectFunction(events);

  return {
    isOver,
    connect,
  };
}
