import { DependencyList, useCallback, useEffect, useState } from 'react';

import { mainStore } from '$stores/MainStore';
import { IS_MAC } from '$utils/config';

let disableHotkeys = false;
const updateListeners = new Set<HotkeyListenerFn>();
const keyUpListeners = new Set<HotkeyListenerFn>();
const pressedKeys = new Set<string>();
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

function isHotkeyModifier(key: string) {
  return reservedModifierKeywords.includes(key);
}

const isHotkeyMatchingKeyboardEvent = (
  e: KeyboardEvent,
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
  } else if (keys) {
    return keys.every(hotkey => pressedKeys.has(hotkey.trim().toLowerCase()));
  } else if (!keys) {
    return true;
  }

  return false;
};

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

document.addEventListener('keydown', e => {
  if (disableHotkeys) {
    e.preventDefault();
  }

  if (!e.key) {
    return;
  }

  const keys = [e.key, e.code].map(mapKey);

  // https://stackoverflow.com/questions/11818637/why-does-javascript-drop-keyup-events-when-the-metakey-is-pressed-on-mac-browser
  if (pressedKeys.has('meta')) {
    pressedKeys.forEach(
      key => !isHotkeyModifier(key) && pressedKeys.delete(key.toLowerCase()),
    );
  }

  keys.forEach(hotkey => pressedKeys.add(hotkey.toLowerCase()));

  for (const [id, parsed] of Object.entries(mainStore.hotkeys)) {
    if (!listeners[id]?.size) {
      continue;
    }

    if (!disableHotkeys && isHotkeyMatchingKeyboardEvent(e, parsed)) {
      for (const listener of listeners[id]) {
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

  const keys = [e.key, e.code].map(mapKey);
  keyUpListeners.forEach(fn => fn());

  // https://stackoverflow.com/questions/11818637/why-does-javascript-drop-keyup-events-when-the-metakey-is-pressed-on-mac-browser
  if (keys.includes('meta')) {
    pressedKeys.clear();
  } else {
    keys.forEach(hotkey => pressedKeys.delete(hotkey.toLowerCase()));
  }

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
    if (!mainStore.hotkeys[id]) {
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

export function usePressed() {
  const [keys, setKeys] = useState('');

  useEffect(() => {
    const onUpdate = () => {
      setKeys([...pressedKeys].join('+'));
    };

    onUpdate();
    updateListeners.add(onUpdate);

    return () => {
      updateListeners.delete(onUpdate);
    };
  }, [setKeys]);

  return keys;
}

export function useGlobalDisable(disabled: boolean) {
  useEffect(() => {
    disableHotkeys = disabled;

    return () => {
      disableHotkeys = false;
    };
  }, [disabled]);
}

export function useRecord(
  onRecorded: (keys: string) => void,
  deps?: DependencyList,
) {
  const [isRecording, setIsRecording] = useState(false);

  const recordedCallback = useCallback(() => {
    onRecorded([...pressedKeys].join('+'));
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
