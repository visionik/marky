import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.{test,spec}.ts', 'packages/*/src/types.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
