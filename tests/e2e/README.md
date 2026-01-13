# End-to-End Tests

Comprehensive E2E test suite using Playwright to verify the FI Calc application works correctly in production.

## Test Suites

### 1. Smoke Tests (`smoke.spec.ts`)

Basic health checks to ensure the app loads and core functionality is present.

**Tests:**
- ✅ Homepage loads successfully
- ✅ Configuration panel displays
- ✅ Calculate button is present and enabled
- ✅ No JavaScript console errors
- ✅ CSS and JavaScript resources load
- ✅ Responsive design works

**Why:** Catches critical failures immediately. If smoke tests fail, everything else will likely fail.

### 2. Configuration Tests (`configuration.spec.ts`)

Tests all configuration inputs and options.

**Tests:**
- ✅ Objective selection (simulate, required portfolio, max withdrawal)
- ✅ Portfolio amount input
- ✅ Retirement length adjustment
- ✅ Asset allocation sliders
- ✅ Withdrawal strategy selection
- ✅ Form value persistence

**Why:** Ensures users can configure their retirement scenarios correctly.

### 3. Simulation Tests (`simulation.spec.ts`)

Tests the core calculation functionality.

**Tests:**
- ✅ Basic simulation execution
- ✅ Calculating state displays
- ✅ Results appear after calculation
- ✅ Different parameter combinations
- ✅ Multiple consecutive simulations

**Why:** Verifies the main purpose of the app works end-to-end.

### 4. Results Tests (`results.spec.ts`)

Tests results display and visualization.

**Tests:**
- ✅ Portfolio statistics display
- ✅ Simulation years shown
- ✅ Individual simulation detail views
- ✅ Success rate information
- ✅ Clickable year elements

**Why:** Ensures users can understand and interact with their results.

### 5. Accessibility Tests (`accessibility.spec.ts`)

Tests for web accessibility compliance.

**Tests:**
- ✅ No auto-detectable accessibility issues
- ✅ Keyboard navigation works
- ✅ Buttons have accessible names
- ✅ Form inputs have labels
- ✅ Sufficient color contrast
- ✅ Screen reader compatibility
- ✅ Logical heading structure

**Why:** Makes the app usable for everyone, including people with disabilities.

### 6. Performance Tests (`performance.spec.ts`)

Tests for acceptable performance.

**Tests:**
- ✅ Page loads in < 5 seconds
- ✅ Time to Interactive < 3 seconds
- ✅ Calculations complete in < 30 seconds
- ✅ No memory leaks on repeated use
- ✅ Large dataset handling
- ✅ UI remains responsive during calculations

**Why:** Ensures good user experience even with complex calculations.

## Running Tests

### Locally

```bash
# Run all E2E tests against local dev server
npm run test:e2e

# Open interactive UI
npm run test:e2e:ui

# Run with browser visible (useful for debugging)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug

# Run a specific test file
npx playwright test tests/e2e/smoke.spec.ts
```

### Against Production

```bash
# Test the live production site
npm run test:prod

# This will test against:
# https://colindacity.github.io/ficalc/
```

### In CI/CD

Tests run automatically after every deployment via GitHub Actions.

**View results:**
- Go to Actions tab
- Click on "E2E Production Tests" workflow
- Download artifacts to see test reports and videos

## Test Configuration

### Local (`playwright.config.ts`)

- **Base URL:** http://localhost:5173
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries:** 0 (immediate feedback)
- **Artifacts:** Screenshots and videos on failure
- **Web Server:** Automatically starts `npm run preview`

### Production (`playwright.prod.config.ts`)

- **Base URL:** https://colindacity.github.io/ficalc
- **Browsers:** Chromium, Firefox (faster, most common)
- **Retries:** 3 (resilient to network issues)
- **Artifacts:** Always capture traces and videos
- **Timeout:** 60s (allows for CDN propagation)

## Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector');

    // Act
    await element.click();

    // Assert
    await expect(element).toHaveText('Expected text');
  });
});
```

### Best Practices

1. **Use data-testid attributes** for critical elements
   ```html
   <button data-testid="calculate-btn">Calculate</button>
   ```
   ```typescript
   const btn = page.getByTestId('calculate-btn');
   ```

2. **Wait for network idle** after navigation
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Use specific locators** (avoid generic selectors)
   ```typescript
   // Good
   page.getByRole('button', { name: 'Calculate' })

   // Less good
   page.locator('button').first()
   ```

4. **Test user workflows** not implementation details
   ```typescript
   // Test what user does, not internal state
   await page.fill('input[name="portfolio"]', '1000000');
   await page.click('button:has-text("Calculate")');
   await expect(page.locator('text=Success Rate')).toBeVisible();
   ```

5. **Make tests independent** (can run in any order)
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Reset state for each test
     await page.goto('/');
   });
   ```

## Debugging Failed Tests

### View Test Report

```bash
# After running tests
npx playwright show-report
```

### Watch Test Recording

Failed tests automatically record video:
1. Run tests: `npm run test:e2e`
2. Check `test-results/` directory
3. Open `.webm` video files

### Debug Interactively

```bash
# Opens browser with Playwright inspector
npm run test:e2e:debug
```

**In debug mode:**
- Step through test actions
- Inspect element locators
- Execute commands manually
- Take screenshots

### Common Issues

**"Element not found"**
- Add wait: `await page.waitForSelector('selector')`
- Check selector is correct
- Element may be in iframe or shadow DOM

**"Timeout exceeded"**
- Increase timeout: `{ timeout: 60000 }`
- Add retry logic
- Check if element actually appears

**"Test is flaky"**
- Add proper waits (not `waitForTimeout`)
- Wait for network idle
- Use retry logic

## CI/CD Integration

### Automatic Execution

E2E tests run automatically:
1. After every deployment (workflow_run trigger)
2. Every hour (cron: `0 * * * *`)
3. Manual trigger (workflow_dispatch)

### Auto-Retry Logic

Production tests retry 3 times with increasing delays:
1. Attempt 1: Immediate
2. Attempt 2: Wait 60s
3. Attempt 3: Wait 120s

**Why:** CDN propagation and network issues can cause transient failures.

### Failure Handling

When tests fail:
1. ❌ Test run marks as failed
2. 📹 Videos of failures are recorded
3. 📊 HTML report generated
4. 📦 Artifacts uploaded (30 day retention)
5. 🎫 GitHub issue created automatically
6. 📧 Team notified

### Viewing Results

**In GitHub:**
1. Go to Actions tab
2. Click "E2E Production Tests"
3. Click on specific run
4. View test summary
5. Download artifacts for details

**Artifacts include:**
- HTML test report
- Video recordings
- Screenshots
- Trace files (for Playwright inspector)

## Performance Benchmarks

### Expected Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Page Load | < 5s | ~2s |
| Time to Interactive | < 3s | ~1.5s |
| Calculate (30yr) | < 30s | ~5s |
| Calculate (50yr) | < 60s | ~10s |

### Monitoring

Performance tests track:
- Load time
- Time to Interactive
- Calculation duration
- Memory usage (leak detection)
- UI responsiveness

Results are logged and can be tracked over time.

## Coverage

### What's Tested

✅ **Functional:** All user workflows and features
✅ **Visual:** Layout, responsiveness, mobile
✅ **Accessibility:** WCAG AA compliance
✅ **Performance:** Load time, calculation speed
✅ **Cross-browser:** Chrome, Firefox, Safari
✅ **Cross-device:** Desktop, tablet, mobile
✅ **Error handling:** Invalid inputs, edge cases

### What's Not Tested

- Server-side logic (runs client-side)
- Historical data accuracy (unit tested)
- Complex mathematical correctness (unit tested)
- Security vulnerabilities (separate security audit needed)

## Maintenance

### Regular Tasks

**Weekly:**
- Review failed test reports
- Update selectors if UI changed
- Add tests for new features

**Monthly:**
- Update Playwright version
- Review and optimize slow tests
- Check test coverage gaps

**Quarterly:**
- Audit accessibility compliance
- Review performance benchmarks
- Update browser versions

### When to Update Tests

- **UI changes:** Update selectors and expectations
- **New features:** Add new test cases
- **Bug fixes:** Add regression tests
- **Performance issues:** Add/update performance tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Getting Help

**Issues with tests:**
- Check test recordings in `test-results/`
- Run with `--headed` to see browser
- Use `--debug` to step through
- Check Playwright docs

**Questions:**
- Open GitHub issue with label "testing"
- Include test file and error message
- Attach video/screenshot if available
