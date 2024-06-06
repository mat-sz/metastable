import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

import info from './package.json';

export default defineConfig(({ mode }) => {
  const isProduction = mode.includes('production');
  const isElectron = mode.includes('electron');

  process.env = {
    ...process.env,
    VITE_APP_VERSION: info.version,
    VITE_APP_NAME: info.displayName,
  };

  const define = {
    __APP_VERSION__: JSON.stringify(info.version),
    __APP_NAME__: JSON.stringify(info.displayName),
  };

  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
    },
    build: {
      assetsInlineLimit: 0,
      outDir: 'dist',
    },
    plugins: [
      react(),
      ...(isElectron
        ? [
            electron([
              {
                entry: 'src/electron/main.ts',
                vite: {
                  build: {
                    lib: {
                      entry: 'src/electron/main.ts',
                      formats: ['cjs'],
                    },
                    rollupOptions: {
                      external: ['sharp', 'chokidar', '@metastable/cppzst'],
                      output: {
                        inlineDynamicImports: true,
                        entryFileNames: '[name].cjs',
                      },
                    },
                  },
                  define,
                },
              },
              {
                entry: 'src/electron/preload.ts',
                onstart: args => {
                  args.reload();
                },
              },
            ]),
            renderer(),
          ]
        : []),
    ],
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
});
