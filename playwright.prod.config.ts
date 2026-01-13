import { defineConfig, devices } from '@playwright/test';

// Configuration for testing production deployment
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 3, // More retries for production
  workers: 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report-prod' }],
    ['list'],
    ['json', { outputFile: 'test-results/prod-results.json' }],
  ],
  timeout: 60000, // Longer timeout for production
  use: {
    baseURL: 'https://colindacity.github.io/ficalc',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
