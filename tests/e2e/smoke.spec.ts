import { test, expect } from '@playwright/test';

test.describe('FI Calc - Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/FI Calc/);

    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('FI Calc');
  });

  test('should display configuration panel', async ({ page }) => {
    await page.goto('/');

    // Check for configuration sections
    await expect(page.locator('text=Configuration')).toBeVisible();
    await expect(page.locator('text=Objective')).toBeVisible();
    await expect(page.locator('text=Time Parameters')).toBeVisible();
    await expect(page.locator('text=Portfolio')).toBeVisible();
  });

  test('should have calculate button', async ({ page }) => {
    await page.goto('/');

    // Find and check calculate button
    const calculateButton = page.locator('button', { hasText: 'Calculate' });
    await expect(calculateButton).toBeVisible();
    await expect(calculateButton).toBeEnabled();
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some time for any lazy-loaded errors
    await page.waitForTimeout(2000);

    expect(errors.length).toBe(0);
  });

  test('should load CSS and JavaScript', async ({ page }) => {
    await page.goto('/');

    // Check that styles are applied
    const header = page.locator('h1').first();
    const fontSize = await header.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );

    // Should have CSS applied (not default browser size)
    expect(fontSize).not.toBe('16px');
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
