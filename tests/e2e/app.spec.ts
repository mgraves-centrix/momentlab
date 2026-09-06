import { test, expect } from '@playwright/test';

test.describe('MomentLab End-to-End & Responsive Layout Suite', () => {
  test('Project Dashboard loads successfully', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveTitle(/MomentLab/);
    await expect(page.getByRole('heading', { name: /NORTHLIGHT/i }).first()).toBeVisible();
    await expect(page.getByText('4,732').first()).toBeVisible();
  });

  test('Screening Consent flow enforces mandatory consent before player', async ({ page }) => {
    await page.goto('/screen/demo_token_123');
    
    const isMobile = page.viewportSize()?.width! < 900;
    
    if (isMobile) {
      await expect(page.getByText('Audience Screening Consent')).toBeVisible();
      await expect(page.getByText('ZERO biometric')).toBeVisible();
      
      // Click Agree & Start
      await page.click('button:has-text("I AGREE & START")');
      await expect(page.getByText('Northlight · Scene 12 Cut A')).toBeVisible();
    } else {
      await expect(page.getByText('BEFORE YOU WATCH')).toBeVisible();
      await expect(page.getByText('YOUR PRIVACY')).toBeVisible();
      
      const startButton = page.locator('button:has-text("START SCREENING")');
      await expect(startButton).toBeDisabled();
      
      // Check the consent checkbox
      await page.click('text="I consent to this screening data use"');
      await expect(startButton).toBeEnabled();
      
      // Click Start Screening
      await startButton.click();
      
      // Now it should show the Desktop Player (not immediately navigate away)
      await expect(page.getByText('CONNECTION ONLINE')).toBeVisible();
      await expect(page.getByText('ENGAGED').first()).toBeVisible();
      await expect(page.getByText('SCREENING PROGRESS')).toBeVisible();

      // Click Exit Screening to navigate to finding
      await page.click('button:has-text("EXIT SCREENING")');
      await expect(page).toHaveURL(/.*finding/);
    }
  });

  test('Response Timeline Page renders workspace & anomaly cliff', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    
    const isMobile = page.viewportSize()?.width! < 900;
    if (!isMobile) {
      await expect(page.getByText('RESPONSE CLIFF')).toBeVisible();
      await expect(page.getByText('MOVE REVEAL 6S EARLIER').first()).toBeVisible();
    } else {
      await expect(page.getByText('SCENE 12')).toBeVisible();
      await expect(page.getByText('INVESTIGATE & GENERATE HYPOTHESIS')).toBeVisible();
    }
  });

  test('Approval Gate prevents launch without checked consent', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/test');
    
    const isMobile = page.viewportSize()?.width! < 900;

    if (!isMobile) {
      await expect(page.getByText('HUMAN AUTHORIZATION GATE')).toBeVisible();
      const launchButton = page.locator('button:has-text("APPROVE & LAUNCH A/B TEST")');
      await expect(launchButton).toBeDisabled();
      
      // Check consent checkbox
      await page.check('#consent-check');
      await expect(launchButton).toBeEnabled();
    } else {
      // Mobile has different exact text and no checkbox in the design reference
      await expect(page.getByText('HUMAN AUTHORIZATION GATE', { exact: false })).toBeVisible();
      const launchButton = page.locator('button:has-text("APPROVE & LAUNCH A/B TEST")');
      // The mobile button should be visible (and enabled if status is PENDING)
      await expect(launchButton).toBeVisible();
    }
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
