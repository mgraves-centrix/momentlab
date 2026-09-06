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
    // Mobile 390x844 Evidence
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/evidence');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-evidence-390.png', fullPage: true });

    // Tap source query ID button to reveal SQL
    const queryBtn390 = page.locator('button:has-text("SOURCE QUERY ID")').first();
    if (await queryBtn390.isVisible()) {
      await queryBtn390.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'docs/images/momentlab-mobile-evidence-390-sql.png' });
      const closeBtn = page.locator('button:has-text("×")').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }

    // Mobile 375x667 Evidence
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/evidence');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-evidence-375.png', fullPage: true });

    const queryBtn375 = page.locator('button:has-text("SOURCE QUERY ID")').first();
    if (await queryBtn375.isVisible()) {
      await queryBtn375.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'docs/images/momentlab-mobile-evidence-375-sql.png' });
    }

    // Mobile Finding & Test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-finding.png', fullPage: true });
    
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/test');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/images/momentlab-mobile-test.png', fullPage: true });
  });
});
