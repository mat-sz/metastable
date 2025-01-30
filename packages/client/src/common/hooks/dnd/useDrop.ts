import React, { useEffect, useRef } from 'react';

import { getElement, useInstance } from './helpers';
import {
  ConnectableElement,
  ConnectElement,
  FactoryOrInstance,
  Identifier,
  ObjectOrRef,
} from './types';

export const DndContext = React.createContext({});

interface DropMonitor<TItem> {
  canDrop(): boolean;
  getItemType(): Identifier | undefined;
  getItem(): TItem | undefined;
  didDrop(): boolean;
  isOver(): boolean;
}

interface DropOptions<TItem = unknown, TCollectedProps = unknown> {
  accept: Identifier | Identifier[];
  drop?: (item: TItem, monitor: DropMonitor<TItem>) => void;
  hover?: (item: TItem, monitor: DropMonitor<TItem>) => void;
  canDrop?: (item: TItem, monitor: DropMonitor<TItem>) => void;
  collect?: (monitor: DropMonitor<TItem>) => TCollectedProps;
}

export function useDrop<TItem, TCollectedProps = undefined>(
  options: FactoryOrInstance<DropOptions<TItem, TCollectedProps>>,
  deps?: React.DependencyList,
): [TCollectedProps, ConnectElement] {
  const opts = useInstance(options, deps);
  const currentRef = useRef<ConnectableElement | undefined>(undefined);
  const disconnectRef = useRef<() => void>();

  const collectedProps = opts.collect?.({
    canDrop() {
      return false;
    },
    didDrop() {
      return false;
    },
    getItem() {
      return undefined;
    },
    getItemType() {
      return undefined;
    },
    isOver() {
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

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer) {
        const items: any[] = [];
        const accept = Array.isArray(opts.accept) ? opts.accept : [opts.accept];
        for (const type of accept) {
          const data = e.dataTransfer.getData(type);
          try {
            const item = JSON.parse(data);
            items.push(item);
          } catch {
            //
          }
        }
        console.log(items);
      }
    };

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);

    disconnectRef.current = () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };

    return ref;
  };

  useEffect(() => {
    return () => disconnectRef.current?.();
  }, []);

  return [collectedProps, connect];
}
