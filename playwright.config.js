import { defineConfig, devices } from '@playwright/test';

const VIEWPORT_WIDTH = process.env.VIEWPORT_WIDTH || '1920';
const VIEWPORT_HEIGHT = process.env.VIEWPORT_HEIGHT || '1080';
const WORKERS = process.env.workers || (process.env.CI ? '1' : '4');
const RUN_THIS = process.env.runThis || '';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  workers: parseInt(WORKERS),

  grep: RUN_THIS ? new RegExp(RUN_THIS) : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list'],
  ],

  use: {
    trace: 'retain-on-failure',

    screenshot: 'only-on-failure',

    viewport: {
      width: parseInt(VIEWPORT_WIDTH),
      height: parseInt(VIEWPORT_HEIGHT),
    },

    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium-1920x1080',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    }
  ],
});
