export interface Hotkey {
  label: string;
  defaultKeys: string;
}

export interface HotkeyGroup {
  label: string;
  hotkeys: Record<string, Hotkey>;
}

export const hotkeyGroups: Record<string, HotkeyGroup> = {
  global: {
    label: 'Global',
    hotkeys: {
      undo: {
        label: 'Undo',
        defaultKeys: 'CmdOrCtrl+Z',
      },
      redo: {
        label: 'Redo',
        defaultKeys: 'CmdOrCtrl+Shift+Z',
      },
    },
  },
  prompt: {
    label: 'Prompt',
    hotkeys: {
      submit: {
        label: 'Submit (add to queue)',
        defaultKeys: 'CmdOrCtrl+Enter',
      },
      cancel: {
        label: 'Cancel',
        defaultKeys: 'Alt+Enter',
      },
      weightIncrease: {
        label: 'Increase selected text weight',
        defaultKeys: 'CmdOrCtrl+Up',
      },
      weightDecrease: {
        label: 'Decrease selected text weight',
        defaultKeys: 'CmdOrCtrl+Down',
      },
      weightReset: {
        label: 'Reset selected text weight',
        defaultKeys: 'CmdOrCtrl+.',
      },
      comment: {
        label: 'Comment out selected text',
        defaultKeys: 'CmdOrCtrl+/',
      },
    },
  },
  maskEditor: {
    label: 'Mask editor',
    hotkeys: {
      saveAndClose: {
        label: 'Save and close',
        defaultKeys: 'Esc',
      },
      reset: {
        label: 'Reset',
        defaultKeys: 'Backspace',
      },
    },
  },
  gallery: {
    label: 'Image gallery',
    hotkeys: {
      close: {
        label: 'Close',
        defaultKeys: 'Esc',
      },
      previous: {
        label: 'Previous',
        defaultKeys: 'Left',
      },
      next: {
        label: 'Next',
        defaultKeys: 'Right',
      },
    },
  },
};

const defaultHotkeys: Record<string, string> = {};
for (const [groupId, group] of Object.entries(hotkeyGroups)) {
  for (const [hotkeyId, hotkey] of Object.entries(group.hotkeys)) {
    defaultHotkeys[`${groupId}_${hotkeyId}`] = hotkey.defaultKeys;
  }
}

export { defaultHotkeys };
