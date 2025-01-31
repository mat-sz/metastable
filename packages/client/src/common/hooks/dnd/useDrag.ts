import React, { useState } from 'react';

import {
  getInstance,
  useConnectFunction,
  useInstance,
  useMemoRef,
} from './helpers';
import { FactoryOrInstance, Identifier } from './types';

interface DragOptions<TItem> {
  type: Identifier;
  item: FactoryOrInstance<TItem>;
  dropEffect?: 'move' | 'copy';
  end?: (item: TItem) => void;
  canDrag?: () => boolean;
}

export function useDrag<TItem>(
  options: FactoryOrInstance<DragOptions<TItem>>,
  deps?: React.DependencyList,
) {
  const opts = useInstance(options, deps);
  const [isDragging, setIsDragging] = useState(false);

  const events = useMemoRef(() => {
    return {
      dragstart: (e: DragEvent) => {
        if (opts.canDrag && !opts.canDrag?.()) {
          e.preventDefault();
          return;
        }

        if (e.dataTransfer) {
          e.dataTransfer.setData(
            opts.type,
            JSON.stringify(getInstance(opts.item)),
          );
          e.dataTransfer.dropEffect = opts.dropEffect ?? 'move';
          setIsDragging(true);
        }
      },
      dragend: () => {
        setIsDragging(false);
      },
    };
  }, [setIsDragging, opts]);

  const connect = useConnectFunction(events, 'draggable');

  return {
    isDragging,
    connect,
  } as const;
}
