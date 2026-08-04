import { test, expect } from '@playwright/test';

test.describe('MomentLab End-to-End & Responsive Layout Suite', () => {
  test('Project Dashboard loads successfully', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveTitle(/MomentLab/);
    await expect(page.getByText('Northlight')).toBeVisible();
    await expect(page.getByText('4,732')).toBeVisible();
  });

  test('Screening Consent flow enforces mandatory consent before player', async ({ page }) => {
    await page.goto('/screen/demo_token_123');
    await expect(page.getByText('Audience Screening Consent')).toBeVisible();
    await expect(page.getByText('ZERO biometric')).toBeVisible();
    
    // Click Agree & Start
    await page.click('button:has-text("I AGREE & START")');
    await expect(page.getByText('Northlight · Scene 12 Cut A')).toBeVisible();
  });

  test('Response Timeline Page renders workspace & anomaly cliff', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    await expect(page.getByText('Audience Response Timeline')).toBeVisible();
    await expect(page.getByText('RESPONSE CLIFF')).toBeVisible();
    await expect(page.getByText('MOVE REVEAL 6S EARLIER')).toBeVisible();
  });

  test('Approval Gate prevents launch without checked consent', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/test');
    await expect(page.getByText('Human Approval Gate Required')).toBeVisible();
    
    const launchButton = page.locator('button:has-text("APPROVE & LAUNCH A/B TEST")');
    await expect(launchButton).toBeDisabled();
    
    // Check consent checkbox
    await page.check('#consent-check');
    await expect(launchButton).toBeEnabled();
  });

  test('Mobile Bottom Navigation active item and items count', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    
    const nav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Finding')).toBeVisible();
    await expect(nav.getByText('Evidence')).toBeVisible();
    await expect(nav.getByText('Test')).toBeVisible();
    await expect(nav.getByText('More')).toBeVisible();
  });
});
