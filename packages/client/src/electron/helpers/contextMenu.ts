import path from 'path';

import electron, {
  app,
  type BrowserWindow,
  type MenuItemConstructorOptions,
  session,
} from 'electron';

import { resolveUrlToMrn } from './resolve';

const removeUnusedMenuItems = (
  menuTemplate: (MenuItemConstructorOptions | undefined | false)[],
) => {
  let notDeletedPreviousElement: MenuItemConstructorOptions;

  return (
    menuTemplate.filter(
      menuItem => !!menuItem && menuItem.visible !== false,
    ) as MenuItemConstructorOptions[]
  ).filter((menuItem, index, array) => {
    const toDelete =
      menuItem.type === 'separator' &&
      (!notDeletedPreviousElement ||
        index === array.length - 1 ||
        array[index + 1].type === 'separator');
    notDeletedPreviousElement = toDelete ? notDeletedPreviousElement : menuItem;
    return !toDelete;
  });
};

const create = (win: BrowserWindow) => {
  const handleContextMenu = (
    _: Electron.Event,
    properties: Electron.ContextMenuParams,
  ) => {
    const { editFlags } = properties;
    const hasText = properties.selectionText.length > 0;
    const can = (type: string) => (editFlags as any)[`can${type}`] && hasText;

    const defaultActions: Record<string, () => MenuItemConstructorOptions> = {
      separator: () => ({ type: 'separator' }),
      learnSpelling: () => ({
        id: 'learnSpelling',
        label: '&Learn Spelling',
        visible: Boolean(
          properties.isEditable && hasText && properties.misspelledWord,
        ),
        click() {
          win.webContents.session.addWordToSpellCheckerDictionary(
            properties.misspelledWord,
          );
        },
      }),
      cut: () => ({
        id: 'cut',
        label: 'Cu&t',
        enabled: can('Cut'),
        visible: properties.isEditable,
        click() {
          win.webContents.cut();
        },
      }),
      copy: () => ({
        id: 'copy',
        label: '&Copy',
        enabled: can('Copy'),
        visible: properties.isEditable || hasText,
        click() {
          win.webContents.copy();
        },
      }),
      paste: () => ({
        id: 'paste',
        label: '&Paste',
        enabled: editFlags.canPaste,
        visible: properties.isEditable,
        click() {
          win.webContents.paste();
        },
      }),
      selectAll: () => ({
        id: 'selectAll',
        label: 'Select &All',
        visible: properties.isEditable,
        click() {
          win.webContents.selectAll();
        },
      }),
      saveImageAs: () => ({
        id: 'saveImageAs',
        label: 'Sa&ve Image As…',
        visible: properties.mediaType === 'image',
        async click() {
          session.defaultSession.once('will-download', (_, item) => {
            let filename = 'image.png';
            if (properties.srcURL.startsWith('metastable+resolve://')) {
              const segments = resolveUrlToMrn(properties.srcURL).split(':');
              filename = segments[segments.length - 1];
            } else {
              filename = `image.${item.getMimeType().split('/')[1]}`;
            }

            item.setSaveDialogOptions({
              defaultPath: path.join(app.getPath('pictures'), filename),
              title: 'Save Image As…',
            });
          });
          win.webContents.downloadURL(properties.srcURL);
        },
      }),
      copyImage: () => ({
        id: 'copyImage',
        label: 'Cop&y Image',
        visible: properties.mediaType === 'image',
        click() {
          win.webContents.copyImageAt(properties.x, properties.y);
        },
      }),
      inspect: () => ({
        id: 'inspect',
        label: 'I&nspect Element',
        click() {
          win.webContents.inspectElement(properties.x, properties.y);

          if (win.webContents.isDevToolsOpened()) {
            win.webContents.devToolsWebContents?.focus();
          }
        },
      }),
    };

    const shouldShowInspectElement = !app.isPackaged;

    function word(suggestion: string): MenuItemConstructorOptions {
      return {
        id: 'dictionarySuggestions',
        label: suggestion,
        visible: Boolean(
          properties.isEditable && hasText && properties.misspelledWord,
        ),
        click(menuItem) {
          win.webContents.replaceMisspelling(menuItem.label!);
        },
      };
    }

    let dictionarySuggestions = [];
    if (
      hasText &&
      properties.misspelledWord &&
      properties.dictionarySuggestions.length > 0
    ) {
      dictionarySuggestions = properties.dictionarySuggestions.map(suggestion =>
        word(suggestion),
      );
    } else {
      dictionarySuggestions.push({
        id: 'dictionarySuggestions',
        label: 'No Guesses Found',
        visible: Boolean(hasText && properties.misspelledWord),
        enabled: false,
      });
    }

    const menuTemplate = removeUnusedMenuItems([
      dictionarySuggestions.length > 0 && defaultActions.separator(),
      ...dictionarySuggestions,
      defaultActions.separator(),
      defaultActions.learnSpelling(),
      defaultActions.separator(),
      defaultActions.cut(),
      defaultActions.copy(),
      defaultActions.paste(),
      defaultActions.selectAll(),
      defaultActions.separator(),
      defaultActions.saveImageAs(),
      defaultActions.copyImage(),
      defaultActions.separator(),
      shouldShowInspectElement && defaultActions.inspect(),
      defaultActions.separator(),
    ]);

    if (menuTemplate.length > 0) {
      const menu = electron.Menu.buildFromTemplate(menuTemplate);

      menu.popup({
        window: win,
      });
    }
  };

  win.webContents.on('context-menu', handleContextMenu);

  return () => {
    if (win.isDestroyed()) {
      return;
    }

    win.webContents.removeListener('context-menu', handleContextMenu);
  };
};

export default function contextMenu() {
  const init = (win: Electron.BrowserWindow) => {
    const disposeMenu = create(win);

    const disposable = () => {
      disposeMenu();
    };

    win.webContents.once('destroyed', disposable);
  };

  for (const win of electron.BrowserWindow.getAllWindows()) {
    init(win);
  }

  electron.app.on('browser-window-created', (_, win) => init(win));
}
