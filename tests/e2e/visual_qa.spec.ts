import { test, expect } from '@playwright/test';

test.describe('Visual QA Screenshots', () => {
  test('Capture Desktop Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1568, height: 1000 });
    
    // Desktop Finding
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    // wait for network idle to ensure charts are rendered
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-built.png', fullPage: true });
  });

  test('Capture Mobile Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Mobile Finding
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-finding.png', fullPage: true });
    
    // Mobile Evidence
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/evidence');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-evidence.png', fullPage: true });

    // Mobile Test
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/test');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-test.png', fullPage: true });
  });
});
