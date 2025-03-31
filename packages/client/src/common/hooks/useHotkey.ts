import { DependencyList, useCallback, useEffect, useState } from 'react';

import { defaultHotkeys } from '$data/hotkeys';
import { useConfigStore } from '$store/config';
import { IS_MAC } from '$utils/config';

let disableHotkeys = false;
const updateListeners = new Set<HotkeyListenerFn>();
const keyUpListeners = new Set<HotkeyListenerFn>();
const reservedModifierKeywords = ['shift', 'alt', 'meta', 'mod', 'ctrl'];
const mappedKeys: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  '.': 'period',
  ',': 'comma',
  '-': 'slash',
  ' ': 'space',
  '`': 'backquote',
  '#': 'backslash',
  '+': 'bracketright',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  AltLeft: 'alt',
  AltRight: 'alt',
  MetaLeft: 'meta',
  MetaRight: 'meta',
  OSLeft: 'meta',
  OSRight: 'meta',
  Control: 'ctrl',
  ControlLeft: 'ctrl',
  ControlRight: 'ctrl',
};

interface HotkeyListener {
  enableOnFormTags?: boolean;
  fn: HotkeyListenerFn;
}
type HotkeyListenerFn = () => void;
const listeners: Record<string, Set<HotkeyListener>> = {};

type KeyboardModifiers = {
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  mod?: boolean;
};

export type ParsedHotkey = KeyboardModifiers & {
  keys?: readonly string[];
};

function mapKey(key?: string): string {
  if (!key) {
    return '';
  }

  key = (mappedKeys[key] || key).toLowerCase();

  if (key === 'cmdorctrl' || key === 'commandorcontrol') {
    return IS_MAC ? 'meta' : 'ctrl';
  }

  return key.trim().replace(/key|digit|numpad|arrow/, '');
}

const isHotkeyMatchingKeyboardEvent = (
  e: KeyboardEvent | React.KeyboardEvent,
  hotkey: ParsedHotkey,
  ignoreModifiers = false,
): boolean => {
  const { alt, meta, mod, shift, ctrl, keys } = hotkey;
  const {
    key: pressedKeyUppercase,
    code,
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
  } = e;

  const keyCode = mapKey(code);
  const pressedKey = pressedKeyUppercase.toLowerCase();

  if (
    !keys?.includes(keyCode) &&
    !keys?.includes(pressedKey) &&
    !['ctrl', 'control', 'unknown', 'meta', 'alt', 'shift', 'os'].includes(
      keyCode,
    )
  ) {
    return false;
  }

  if (!ignoreModifiers) {
    if (alt === !altKey && pressedKey !== 'alt') {
      return false;
    }

    if (shift === !shiftKey && pressedKey !== 'shift') {
      return false;
    }

    if (mod) {
      if (!metaKey && !ctrlKey) {
        return false;
      }
    } else {
      if (meta === !metaKey && pressedKey !== 'meta' && pressedKey !== 'os') {
        return false;
      }

      if (
        ctrl === !ctrlKey &&
        pressedKey !== 'ctrl' &&
        pressedKey !== 'control'
      ) {
        return false;
      }
    }
  }

  if (
    keys &&
    keys.length === 1 &&
    (keys.includes(pressedKey) || keys.includes(keyCode))
  ) {
    return true;
  }

  return false;
};

let parsedHotkeys: Record<string, ParsedHotkey> = {};

useConfigStore.subscribe(state => {
  const overrides = state.data?.app?.hotkeys;
  const hotkeys = { ...defaultHotkeys };

  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (value && key in hotkeys) {
        hotkeys[key] = value;
      }
    }
  }

  parsedHotkeys = Object.fromEntries(
    Object.entries(hotkeys).map(([id, keys]) => [id, parseHotkey(keys)]),
  );
});

export function matchHotkey(
  e: KeyboardEvent | React.KeyboardEvent,
  group?: string,
) {
  for (const [id, parsed] of Object.entries(parsedHotkeys)) {
    if (group && !id.startsWith(`${group}_`)) {
      continue;
    }

    if (isHotkeyMatchingKeyboardEvent(e, parsed)) {
      return id.replace(`${group}_`, '');
    }
  }
}

export function parseHotkey(
  hotkey: string,
  combinationKey = '+',
): ParsedHotkey {
  const keys = hotkey
    .toLocaleLowerCase()
    .split(combinationKey)
    .map(k => mapKey(k));

  const modifiers: KeyboardModifiers = {
    alt: keys.includes('alt'),
    ctrl: keys.includes('ctrl') || keys.includes('control'),
    shift: keys.includes('shift'),
    meta: keys.includes('meta'),
    mod: keys.includes('mod'),
  };

  const singleCharKeys = keys.filter(
    k => !reservedModifierKeywords.includes(k),
  );

  return {
    ...modifiers,
    keys: singleCharKeys,
  };
}

const formTags = ['input', 'textarea', 'select'];
function isOnFormTag({ target }: KeyboardEvent): boolean {
  const targetTagName = target && (target as HTMLElement).tagName;
  return formTags.includes(targetTagName?.toLowerCase() as any);
}

let lastKey: string[] = [];

document.addEventListener('keydown', e => {
  if (disableHotkeys) {
    e.preventDefault();
  }

  if (!e.key) {
    return;
  }

  lastKey = [];
  if (e.ctrlKey) {
    lastKey.push('ctrl');
  }
  if (e.shiftKey) {
    lastKey.push('shift');
  }
  if (e.metaKey) {
    lastKey.push('meta');
  }
  if (e.altKey) {
    lastKey.push('alt');
  }

  lastKey.push(e.code);

  if (!disableHotkeys) {
    const hotkeyId = matchHotkey(e);
    if (hotkeyId && listeners[hotkeyId]?.size) {
      for (const listener of listeners[hotkeyId]) {
        if (!listener.enableOnFormTags && isOnFormTag(e)) {
          continue;
        }
        e.preventDefault();
        listener.fn();
      }
    }
  }

  updateListeners.forEach(fn => fn());
});

document.addEventListener('keyup', e => {
  if (!e.key) {
    return;
  }

  keyUpListeners.forEach(fn => fn());

  updateListeners.forEach(fn => fn());
});

export function useHotkey(
  id: string,
  listener: HotkeyListenerFn,
  options?: {
    enableOnFormTags?: boolean;
  },
  dependencies?: DependencyList,
) {
  useEffect(() => {
    if (!defaultHotkeys[id]) {
      console.warn(`Unregistered hotkey ID: ${id}`);
    }

    listeners[id] ??= new Set();
    const listenerData: HotkeyListener = {
      ...options,
      fn: listener,
    };
    listeners[id].add(listenerData);

    return () => {
      listeners[id].delete(listenerData);
    };
  }, dependencies);
}

export function useRecord(
  onRecorded: (keys: string) => void,
  deps?: DependencyList,
) {
  const [isRecording, setIsRecording] = useState(false);

  const recordedCallback = useCallback(() => {
    onRecorded([...lastKey].join('+'));
    stop();
  }, [deps]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    disableHotkeys = true;
    keyUpListeners.add(recordedCallback);

    return () => {
      disableHotkeys = false;
      keyUpListeners.delete(recordedCallback);
    };
  }, [isRecording, recordedCallback]);

  const start = useCallback(() => {
    setIsRecording(true);
  }, [setIsRecording]);

  const stop = useCallback(() => {
    setIsRecording(false);
  }, [setIsRecording]);

  return {
    isRecording,
    start,
    stop,
  };
}
