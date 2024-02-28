import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode.includes('production');
  const isElectron = mode.includes('electron');

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
                      external: ['sharp', 'chokidar'],
                      output: {
                        inlineDynamicImports: true,
                        entryFileNames: '[name].cjs',
                      },
                    },
                  },
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
    resolve: {
      ...(isProduction
        ? {
            // Enables MobX production build
            mainFields: ['jsnext:main', 'module', 'main'],
          }
        : {}),
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@api': path.resolve(__dirname, './src/common/api'),
        '@components': path.resolve(__dirname, './src/components'),
        '@editor': path.resolve(__dirname, './src/common/editor'),
        '@hooks': path.resolve(__dirname, './src/common/hooks'),
        '@modals': path.resolve(__dirname, './src/modals'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@utils': path.resolve(__dirname, './src/common/utils'),
      },
    },
  };
});
