import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './test-setup.ts',
    testTimeout: 300000, // 5 minutes for long-running integration tests
    hookTimeout: 30000,
    teardownTimeout: 30000,
    isolate: false, // Allow tests to share environment
  },
});
