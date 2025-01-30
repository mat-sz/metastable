import React, { useEffect, useRef } from 'react';

import { getElement, getInstance, useInstance } from './helpers';
import {
  ConnectableElement,
  ConnectElement,
  FactoryOrInstance,
  Identifier,
  ObjectOrRef,
} from './types';

interface DragMonitor {
  canDrag(): boolean;
  didDrop(): boolean;
  isDragging(): boolean;
  getTargetIds(): Identifier[];
}

interface DragOptions<TItem, TCollectedProps = unknown> {
  type: Identifier;
  item: FactoryOrInstance<TItem>;
  dropEffect?: 'move' | 'copy';
  end?: (item: TItem, monitor: DragMonitor) => void;
  canDrag?: (monitor: DragMonitor) => void;
  isDragging?: (monitor: DragMonitor) => void;
  collect?: (monitor: DragMonitor) => TCollectedProps;
}

export function useDrag<TItem, TCollectedProps = undefined>(
  options: FactoryOrInstance<DragOptions<TItem, TCollectedProps>>,
  deps?: React.DependencyList,
): [TCollectedProps, ConnectElement] {
  const opts = useInstance(options, deps);
  const currentRef = useRef<ConnectableElement | undefined>(undefined);
  const disconnectRef = useRef<() => void>();

  const collectedProps = opts.collect?.({
    canDrag() {
      return false;
    },
    didDrop() {
      return false;
    },
    getTargetIds() {
      return [];
    },
    isDragging() {
      return false;
    },
  }) as TCollectedProps;
  const connect = (ref: ObjectOrRef<ConnectableElement>) => {
    const el = getElement(ref);
    if (currentRef.current === el) {
      return ref;
    }

    disconnectRef.current?.();
    currentRef.current = el;

    if (!el) {
      return ref;
    }

    el.setAttribute('draggable', 'true');

    const onDragStart = (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData(
          opts.type,
          JSON.stringify(getInstance(opts.item)),
        );
        e.dataTransfer.effectAllowed = opts.dropEffect ?? 'move';
      }
    };

    el.addEventListener('dragstart', onDragStart);

    disconnectRef.current = () => {
      el.removeAttribute('draggable');
      el.removeEventListener('dragstart', onDragStart);
    };

    return ref;
  };

  useEffect(() => {
    return () => disconnectRef.current?.();
  }, []);

  return [collectedProps, connect];
}
