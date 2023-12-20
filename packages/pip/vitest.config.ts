import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  name: '@metastable/pip',
  test: {
    globals: true,
  },
}));
