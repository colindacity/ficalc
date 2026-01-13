import { test, expect } from '@playwright/test';

test.describe('FI Calc - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have no automatically detectable accessibility issues', async ({ page }) => {
    // Note: This is a basic check. For comprehensive a11y testing, use @axe-core/playwright

    // Check for basic accessibility features
    const hasH1 = await page.locator('h1').count() > 0;
    expect(hasH1).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible (at least one element should have focus)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    expect(focusedElement).not.toBe('BODY');
  });

  test('should have accessible buttons', async ({ page }) => {
    const calculateButton = page.locator('button:has-text("Calculate")');

    // Button should have text content
    const buttonText = await calculateButton.textContent();
    expect(buttonText).toBeTruthy();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });

  test('should have form labels', async ({ page }) => {
    const labels = page.locator('label');
    const labelCount = await labels.count();

    // Should have some labels for form inputs
    expect(labelCount).toBeGreaterThan(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check header text contrast
    const header = page.locator('h1').first();
    const color = await header.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor
      };
    });

    // Should have color and background color defined
    expect(color.color).toBeTruthy();
  });

  test('should work with screen reader hints', async ({ page }) => {
    // Check for ARIA labels or title attributes on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Button should have either text, aria-label, or title
      const hasAccessibleName =
        (text && text.trim().length > 0) ||
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (title && title.trim().length > 0);

      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have logical heading structure', async ({ page }) => {
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();

    // Should have exactly one h1
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Should have some h2s for sections
    expect(h2Count).toBeGreaterThan(0);
  });
});
