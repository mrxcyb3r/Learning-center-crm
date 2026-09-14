/**
 * Test-only configuration.
 *
 * Vite's dev/build pipeline handles `?raw` imports of the knowledge corpus.
 * The vitest node runner does not, so the corpus is mocked in vitest.setup.ts
 * with physical file reads (same content, no `?raw` in the SSR pipeline).
 */
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  assetsInclude: ['**/*.md'],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});