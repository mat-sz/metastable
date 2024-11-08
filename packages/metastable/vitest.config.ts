import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@metastable/metastable',
    globals: true,
  },
  resolve: {
    alias: {
      '#metastable': path.resolve(__dirname, './src/metastable.ts'),
      '#helpers': path.resolve(__dirname, './src/helpers'),
    },
  },
});
