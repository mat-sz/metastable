import path from 'path';
import react from '@vitejs/plugin-react';

import info from './package.json';

export const define = {
  __APP_VERSION__: JSON.stringify(info.version),
  __APP_NAME__: JSON.stringify(info.displayName),
};

process.env = {
  ...process.env,
  VITE_APP_VERSION: info.version,
  VITE_APP_NAME: info.displayName,
};

export function getConfig(mode: string): any {
  const isProduction = mode.includes('production');

  return {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
    plugins: [react()],
    define,
    resolve: {
      ...(isProduction
        ? {
            // Enables MobX production build
            mainFields: ['jsnext:main', 'module', 'main'],
          }
        : {}),
      alias: {
        $: path.resolve(__dirname, './src'),
        $api: path.resolve(__dirname, './src/common/api'),
        $components: path.resolve(__dirname, './src/components'),
        $editor: path.resolve(__dirname, './src/common/editor'),
        $hooks: path.resolve(__dirname, './src/common/hooks'),
        $modals: path.resolve(__dirname, './src/modals'),
        $stores: path.resolve(__dirname, './src/stores'),
        $utils: path.resolve(__dirname, './src/common/utils'),
      },
    },
  };
}
