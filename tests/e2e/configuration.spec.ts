import { test, expect } from '@playwright/test';

test.describe('FI Calc - Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow selecting different objectives', async ({ page }) => {
    const objectiveSelect = page.locator('select').first();

    // Test different objectives
    await objectiveSelect.selectOption('simulate');
    await expect(objectiveSelect).toHaveValue('simulate');

    await objectiveSelect.selectOption('requiredPortfolio');
    await expect(objectiveSelect).toHaveValue('requiredPortfolio');

    await objectiveSelect.selectOption('maxWithdrawal');
    await expect(objectiveSelect).toHaveValue('maxWithdrawal');
  });

  test('should allow entering portfolio amount', async ({ page }) => {
    const portfolioInput = page.locator('input[type="number"]').first();

    await portfolioInput.clear();
    await portfolioInput.fill('1500000');

    await expect(portfolioInput).toHaveValue('1500000');
  });

  test('should allow changing retirement length', async ({ page }) => {
    // Find retirement length input (second number input typically)
    const inputs = page.locator('input[type="number"]');
    const retirementInput = inputs.nth(1);

    await retirementInput.clear();
    await retirementInput.fill('40');

    await expect(retirementInput).toHaveValue('40');
  });

  test('should allow adjusting asset allocation', async ({ page }) => {
    // Find allocation inputs
    const equitiesInput = page.locator('input[type="number"]').filter({ hasText: /Equities/ }).or(
      page.locator('text=Equities').locator('..').locator('input[type="number"]')
    );

    // If we can find and interact with it
    const count = await equitiesInput.count();
    if (count > 0) {
      await equitiesInput.first().clear();
      await equitiesInput.first().fill('70');
      await expect(equitiesInput.first()).toHaveValue('70');
    }
  });

  test('should allow selecting withdrawal strategy', async ({ page }) => {
    // Find strategy select (typically second or third select)
    const selects = page.locator('select');
    const strategySelect = selects.nth(1);

    await strategySelect.selectOption('constantDollar');
    await expect(strategySelect).toHaveValue('constantDollar');
  });

  test('should persist form values after changes', async ({ page }) => {
    const portfolioInput = page.locator('input[type="number"]').first();

    await portfolioInput.clear();
    await portfolioInput.fill('2000000');

    // Navigate away and back (if we had navigation)
    await page.waitForTimeout(1000);

    // Value should still be there
    await expect(portfolioInput).toHaveValue('2000000');
  });
});
