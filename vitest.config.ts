import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx,mjs}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'data/mongo/**',
      'data/rabbitmq/**',
      'data/minio/**',
      'data/letsencrypt/**',
      'data/certbot-www/**',
    ],
    environmentMatchGlobs: [
      ['apps/ui/**', 'jsdom'],
      ['**', 'node'],
    ],
    setupFiles: ['./apps/ui/src/test/setup.ts'],
  },
});
