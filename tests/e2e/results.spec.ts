import { test, expect } from '@playwright/test';

test.describe('FI Calc - Results & Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run a simulation to get results
    const calculateButton = page.locator('button:has-text("Calculate")');
    await calculateButton.click();
    await page.waitForSelector('text=/Results/i', { timeout: 30000 });
  });

  test('should display portfolio statistics', async ({ page }) => {
    // Check for portfolio stats
    const bodyText = await page.textContent('body');

    // Should have some financial information
    const hasFinancialData =
      bodyText?.includes('$') ||
      bodyText?.includes('%') ||
      bodyText?.includes('portfolio') ||
      bodyText?.includes('withdrawal');

    expect(hasFinancialData).toBeTruthy();
  });

  test('should show simulation years', async ({ page }) => {
    // Check if year buttons or year information is displayed
    const yearPattern = /19\d{2}|20\d{2}/; // Match years like 1990 or 2020
    const bodyText = await page.textContent('body');

    expect(bodyText).toMatch(yearPattern);
  });

  test('should allow viewing individual simulation details', async ({ page }) => {
    // Look for clickable year elements
    const yearButtons = page.locator('button').filter({ hasText: /19\d{2}|20\d{2}/ });

    const count = await yearButtons.count();
    if (count > 0) {
      // Click the first year
      await yearButtons.first().click();

      // Should show more detailed information
      await page.waitForTimeout(1000);

      // Check if detail view is shown
      const hasDetailView =
        await page.locator('text=/Detail|Portfolio Over Time|Simulation/i').isVisible() ||
        await page.locator('button:has-text("Back")').isVisible();

      expect(hasDetailView).toBeTruthy();
    }
  });

  test('should display success rate information', async ({ page }) => {
    // Look for success rate
    const successRateText = await page.locator('text=/Success Rate/i').textContent();

    expect(successRateText).toBeTruthy();
    // Should contain percentage
    expect(successRateText).toMatch(/%/);
  });

  test('should show total simulations count', async ({ page }) => {
    const bodyText = await page.textContent('body');

    // Should mention number of simulations
    expect(bodyText).toMatch(/\d+\s*simulations?/i);
  });
});
