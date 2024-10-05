import { defineConfig } from 'electron-vite';

import { define, getConfig } from './common.config';

process.env.VITE_IS_ELECTRON = '1';

export default defineConfig(env => {
  return {
    main: {
      build: {
        outDir: 'out',
        emptyOutDir: false,
        lib: {
          entry: 'src/electron/main.ts',
          formats: ['es'],
        },
        rollupOptions: {
          input: 'src/electron/main.ts',
          external: ['sharp', 'chokidar'],
        },
      },
      define,
    },
    preload: {
      build: {
        outDir: 'out',
        emptyOutDir: false,
        lib: {
          entry: 'src/electron/preload.ts',
          formats: ['cjs'],
        },
        rollupOptions: {
          input: 'src/electron/preload.ts',
        },
      },
    },
    renderer: {
      root: '.',
      build: {
        assetsInlineLimit: 0,
        outDir: 'dist',
        rollupOptions: {
          input: './index.html',
        },
        watch: {},
      },
      ...getConfig(env.mode),
    },
  } as any;
});
