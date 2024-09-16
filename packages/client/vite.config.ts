import { defineConfig } from 'vite';

import { getConfig } from './common.config';

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
    },
    build: {
      assetsInlineLimit: 0,
      outDir: 'dist',
    },
    ...getConfig(mode),
  };
});
