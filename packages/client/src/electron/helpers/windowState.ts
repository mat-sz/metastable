import path from 'path';

import { JSONFile } from '@metastable/common/fs';
import { app, type BrowserWindow } from 'electron';

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

export async function windowStateKeeper(windowName: string) {
  let window: BrowserWindow, windowState: WindowState;

  const uiConfig = new JSONFile<any>(
    path.join(app.getPath('userData'), 'ui.json'),
    {},
  );

  const setBounds = async () => {
    const data = await uiConfig.readJson();
    const state = data?.windowState?.[windowName];
    return (
      state ?? {
        x: undefined,
        y: undefined,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
      }
    );
  };

  let saveTimeout: any = undefined;
  const updateState = async () => {
    const isMaximized = window.isMaximized();
    if (!isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = isMaximized;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveState();
    }, 100);
  };

  const saveState = async () => {
    let data = await uiConfig.readJson();
    if (!data) {
      data = {};
    }

    if (!data.windowState) {
      data.windowState = {};
    }

    data.windowState[windowName] = windowState;
    await uiConfig.writeJson(data);
  };

  const track = async (win: BrowserWindow) => {
    window = win;
    ['resize', 'move', 'close'].forEach(event => {
      win.on(event as any, updateState);
    });
  };

  return {
    ...(await setBounds()),
    track,
    saveState,
  };
}
