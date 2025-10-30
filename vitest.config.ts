import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-cli/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/components/**',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
  },
});
