import { test, expect } from '@playwright/test';

test.describe('FI Calc - Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should run a basic simulation', async ({ page }) => {
    // Set up a simple simulation
    const portfolioInput = page.locator('input[type="number"]').first();
    await portfolioInput.clear();
    await portfolioInput.fill('1000000');

    // Find withdrawal input (look for label or nearby text)
    const withdrawalInput = page.locator('input[type="number"]').filter({ hasText: /withdrawal/i }).or(
      page.locator('label:has-text("withdrawal")').locator('..').locator('input[type="number"]')
    ).first();

    if (await withdrawalInput.count() > 0) {
      await withdrawalInput.clear();
      await withdrawalInput.fill('40000');
    }

    // Click calculate button
    const calculateButton = page.locator('button:has-text("Calculate")');
    await calculateButton.click();

    // Wait for results to appear (with longer timeout for calculation)
    await page.waitForSelector('text=/Results|Success Rate|simulations/i', {
      timeout: 30000
    });

    // Check that results are displayed
    const resultsText = await page.textContent('body');
    expect(resultsText).toMatch(/success rate|simulations/i);
  });

  test('should show calculating state', async ({ page }) => {
    const calculateButton = page.locator('button:has-text("Calculate")');
    await calculateButton.click();

    // Should show some loading state
    await expect(
      page.locator('text=/Calculating|Running|Loading/i')
    ).toBeVisible({ timeout: 2000 });
  });

  test('should display results summary', async ({ page }) => {
    // Set up and run simulation
    const calculateButton = page.locator('button:has-text("Calculate")');
    await calculateButton.click();

    // Wait for results
    await page.waitForSelector('text=/Results/i', { timeout: 30000 });

    // Check for key result elements
    const hasSuccessRate = await page.locator('text=/Success Rate/i').isVisible();
    const hasSimulations = await page.locator('text=/simulations/i').isVisible();

    expect(hasSuccessRate || hasSimulations).toBeTruthy();
  });

  test('should handle calculation with different parameters', async ({ page }) => {
    // Test with high withdrawal (likely to fail some scenarios)
    const portfolioInput = page.locator('input[type="number"]').first();
    await portfolioInput.clear();
    await portfolioInput.fill('500000');

    const calculateButton = page.locator('button:has-text("Calculate")');
    await calculateButton.click();

    // Should still complete without errors
    await page.waitForSelector('text=/Results|Success|simulations/i', {
      timeout: 30000
    });
  });

  test('should allow running multiple simulations', async ({ page }) => {
    const calculateButton = page.locator('button:has-text("Calculate")');

    // Run first simulation
    await calculateButton.click();
    await page.waitForSelector('text=/Results/i', { timeout: 30000 });

    // Change a parameter
    const portfolioInput = page.locator('input[type="number"]').first();
    await portfolioInput.clear();
    await portfolioInput.fill('1500000');

    // Run second simulation
    await calculateButton.click();
    await page.waitForSelector('text=/Results/i', { timeout: 30000 });

    // Should have new results
    expect(await page.locator('text=/Results/i').isVisible()).toBeTruthy();
  });
});
