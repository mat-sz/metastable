import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

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
              },
            ]),
            renderer(),
          ]
        : []),
    ],
    resolve: isProduction
      ? {
          // Enables MobX production build
          mainFields: ['jsnext:main', 'module', 'main'],
        }
      : undefined,
  };
});
