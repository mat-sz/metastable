import { ImageFile } from '@metastable/types';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { MdNoPhotography } from 'react-icons/md';
import { usePointerDrag } from 'react-use-pointer-drag';

import { Rectangle } from '$editor/primitives/Rectangle';
import { Vector2 } from '$editor/primitives/Vector2';
import { Point } from '$editor/types';
import styles from './FileList.module.scss';

interface Props {
  items: ImageFile[];
  selection?: string[];
  onSelect?: (itemIds: string[]) => void;
  onOpen?: (itemIds: string[]) => void;
}

type SelectionMode = 'replace' | 'add' | 'xor';

function getBox(
  listEl: HTMLDivElement,
  offset: Point,
  startPoint: Point,
  endPoint: Point,
) {
  const rect = listEl.getBoundingClientRect();
  const start = new Vector2(
    startPoint.x - rect.left + offset.x,
    startPoint.y - rect.top + offset.y,
  );
  const end = new Vector2(
    endPoint.x - rect.left + listEl.scrollLeft,
    endPoint.y - rect.top + listEl.scrollTop,
  );
  return new Rectangle(start, end);
}

function mergeSelection(a: string[], b: string[], mode: SelectionMode) {
  switch (mode) {
    case 'add':
      return [...new Set([...a, ...b])];
    case 'xor': {
      const set = new Set(a);
      for (const item of b) {
        if (set.has(item)) {
          set.delete(item);
        } else {
          set.add(item);
        }
      }
      return [...set];
    }
    default:
      return b;
  }
}

function getDragSelection(
  listEl: HTMLDivElement,
  box: Rectangle,
  currentSelection: string[] = [],
  mode: SelectionMode = 'replace',
) {
  const rect = listEl.getBoundingClientRect();

  const elements = listEl.querySelectorAll('*[data-id]');
  const selection: string[] = [];
  for (const element of elements) {
    const childRect = element.getBoundingClientRect();
    const x1 = childRect.left - rect.left;
    const y1 = childRect.top - rect.top;
    const x2 = x1 + childRect.width;
    const y2 = y1 + childRect.height;
    if (
      x1 <= box.x + box.width &&
      x2 >= box.x &&
      y1 <= box.y + box.height &&
      y2 >= box.y
    ) {
      selection.push(element.getAttribute('data-id')!);
    }
  }

  return mergeSelection(currentSelection, selection, mode);
}

export const FileList: React.FC<Props> = ({
  items,
  selection = [],
  onSelect = () => {},
  onOpen = () => {},
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const dragSelectStartOffsetRef = useRef<Point>({
    x: 0,
    y: 0,
  });
  const lastClickedIdRef = useRef<string>();
  const [dragSelectionPreview, setDragSelectionPreview] = useState<string[]>();

  const { dragProps } = usePointerDrag({
    dragPredicate: ({ deltaX, deltaY, initialEvent }) => {
      if (
        initialEvent &&
        initialEvent.pointerType === 'mouse' &&
        initialEvent.button !== 0
      ) {
        return false;
      }

      return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)) >= 25;
    },
    preventDefault: true,
    stopPropagation: true,
    pointerDownPreventDefault: true,
    pointerDownStopPropagation: true,
    onStart: ({ x, y }) => {
      const listEl = listRef.current;
      const boxEl = selectionBoxRef.current;
      if (!listEl || !boxEl) {
        return;
      }

      const rect = listEl.getBoundingClientRect();
      dragSelectStartOffsetRef.current = {
        x: listEl.scrollLeft,
        y: listEl.scrollTop,
      };
      boxEl.style.display = 'block';
      boxEl.style.left = `${x - rect.left + listEl.scrollLeft}px`;
      boxEl.style.top = `${y - rect.top + listEl.scrollLeft}px`;
      boxEl.style.width = `1px`;
      boxEl.style.height = `1px`;
    },
    onMove: ({ x, y, startX, startY, initialEvent }) => {
      const listEl = listRef.current;
      const boxEl = selectionBoxRef.current;
      if (!listEl || !boxEl) {
        return;
      }

      const box = getBox(
        listEl,
        dragSelectStartOffsetRef.current,
        { x: startX, y: startY },
        { x, y },
      );
      boxEl.style.left = `${box.x}px`;
      boxEl.style.top = `${box.y}px`;
      boxEl.style.width = `${box.width}px`;
      boxEl.style.height = `${box.height}px`;

      const mode = initialEvent?.shiftKey
        ? 'add'
        : initialEvent?.ctrlKey
          ? 'xor'
          : 'replace';
      setDragSelectionPreview(getDragSelection(listEl, box, selection, mode));
    },
    onEnd: ({ startX, startY, x, y, initialEvent }) => {
      const listEl = listRef.current;
      const boxEl = selectionBoxRef.current;
      if (!listEl || !boxEl) {
        return;
      }

      boxEl.style.display = 'none';
      const box = getBox(
        listEl,
        dragSelectStartOffsetRef.current,
        { x: startX, y: startY },
        { x, y },
      );

      const mode = initialEvent?.ctrlKey
        ? 'xor'
        : initialEvent?.shiftKey
          ? 'add'
          : 'replace';
      onSelect(getDragSelection(listEl, box, selection, mode));
      setDragSelectionPreview(undefined);
    },
    onClick: () => {
      onSelect([]);
    },
  });

  return items.length ? (
    <div className={styles.wrapper} ref={listRef} {...dragProps()}>
      <div className={styles.selectionBox} ref={selectionBoxRef} />
      <div className={styles.files}>
        {items.map((item, index) => (
          <a
            className={clsx(styles.file, {
              [styles.selected]: (dragSelectionPreview ?? selection)?.includes(
                item.name,
              ),
            })}
            href={item.image.url}
            target="_blank"
            rel="noopener noreferrer"
            key={item.name}
            onPointerDown={e => {
              e.stopPropagation();
            }}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();

              if (e.shiftKey) {
                const last = lastClickedIdRef.current;
                const lastIndex = items.findIndex(item => item.name === last);
                if (lastIndex === -1) {
                  onSelect([item.name]);
                } else {
                  const newSelection = items
                    .slice(
                      Math.min(lastIndex, index),
                      Math.max(lastIndex, index) + 1,
                    )
                    .map(item => item.name);
                  if (e.ctrlKey) {
                    onSelect(mergeSelection(selection, newSelection, 'add'));
                  } else {
                    onSelect(newSelection);
                  }
                }
              } else if (e.ctrlKey) {
                onSelect(mergeSelection(selection, [item.name], 'xor'));
              } else {
                onSelect([item.name]);
              }

              if (!e.shiftKey) {
                lastClickedIdRef.current = item.name;
              }
            }}
            onDoubleClick={() => {
              onOpen([item.name]);
            }}
            data-id={item.name}
          >
            {item.image.thumbnailUrl ? (
              <img src={item.image.thumbnailUrl} />
            ) : (
              <div className={styles.icon}>
                <MdNoPhotography />
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  ) : (
    <div className={styles.info}>This directory is empty.</div>
  );
};
