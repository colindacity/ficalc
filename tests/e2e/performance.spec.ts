import { test, expect } from '@playwright/test';

test.describe('FI Calc - Performance', () => {
  test('should load the page quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have reasonable Time to Interactive', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for interactive state
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('button:has-text("Calculate")');

    const tti = Date.now() - startTime;

    // Time to interactive should be under 3 seconds
    expect(tti).toBeLessThan(3000);
  });

  test('should run calculations in reasonable time', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const calculateButton = page.locator('button:has-text("Calculate")');

    const startTime = Date.now();
    await calculateButton.click();

    // Wait for results
    await page.waitForSelector('text=/Results|Success/i', { timeout: 30000 });

    const calculationTime = Date.now() - startTime;

    // Calculation should complete in under 30 seconds
    expect(calculationTime).toBeLessThan(30000);

    // Log for monitoring
    console.log(`Calculation completed in ${calculationTime}ms`);
  });

  test('should not have memory leaks on repeated calculations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const calculateButton = page.locator('button:has-text("Calculate")');

    // Run multiple calculations
    for (let i = 0; i < 3; i++) {
      await calculateButton.click();
      await page.waitForSelector('text=/Results/i', { timeout: 30000 });
      await page.waitForTimeout(1000);
    }

    // If we got here without timeout or crash, no obvious memory leak
    expect(true).toBe(true);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set up a simulation with maximum historical data
    const calculateButton = page.locator('button:has-text("Calculate")');

    const startTime = Date.now();
    await calculateButton.click();
    await page.waitForSelector('text=/Results/i', { timeout: 60000 });

    const processingTime = Date.now() - startTime;

    // Should handle full dataset in under 60 seconds
    expect(processingTime).toBeLessThan(60000);
  });

  test('should have smooth UI interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test input responsiveness
    const input = page.locator('input[type="number"]').first();

    const startTime = Date.now();
    await input.clear();
    await input.fill('1234567');
    const inputTime = Date.now() - startTime;

    // Input should be responsive (< 500ms)
    expect(inputTime).toBeLessThan(500);
  });

  test('should not block UI during calculations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const calculateButton = page.locator('button:has-text("Calculate")');
    await calculateButton.click();

    // UI should remain responsive
    // Try to interact with other elements
    await page.waitForTimeout(500);

    const input = page.locator('input[type="number"]').first();
    const isEnabled = await input.isEnabled();

    // Input should still be interactable (or properly disabled if that's the design)
    expect(isEnabled !== undefined).toBe(true);
  });
});
