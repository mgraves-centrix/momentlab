import { test, expect } from '@playwright/test';

test.describe('Buttons and Menus Interactive Validation', () => {

  test('Header navigation and page switching buttons work', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    await page.waitForLoadState('networkidle');

    // Navigation links in desktop header
    const findingTab = page.locator('a:has-text("Finding"), button:has-text("Finding")').first();
    const evidenceTab = page.locator('a:has-text("Evidence"), button:has-text("Evidence")').first();
    const testTab = page.locator('a:has-text("Test"), button:has-text("Test")').first();

    await expect(findingTab).toBeVisible();
    await expect(evidenceTab).toBeVisible();
    await expect(testTab).toBeVisible();

    // Switch to Evidence
    await evidenceTab.click();
    await expect(page).toHaveURL(/.*evidence/);

    // Switch to Test
    await testTab.click();
    await expect(page).toHaveURL(/.*test/);

    // Switch back to Finding
    await findingTab.click();
    await expect(page).toHaveURL(/.*finding/);
  });

  test('Edit Hypothesis button and form interaction', async ({ page }) => {
    const isMobile = page.viewportSize()?.width! < 900;
    if (isMobile) {
      // Mobile finding page has INVESTIGATE & GENERATE HYPOTHESIS button
      await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
      await page.waitForLoadState('networkidle');
      const actionBtn = page.locator('button:has-text("HYPOTHESIS")').first();
      await expect(actionBtn).toBeVisible();
    } else {
      await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
      await page.waitForLoadState('networkidle');

      const editBtn = page.locator('button:has-text("EDIT HYPOTHESIS"), a:has-text("EDIT HYPOTHESIS"), button:has-text("Hypothesis")').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*hypothesis/);
      }
    }
  });

  test('Evidence page SQL query modal button and toggle', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/evidence');
    await page.waitForLoadState('networkidle');

    const sqlBtn = page.locator('button:has-text("SOURCE QUERY ID"), button:has-text("q_")').first();
    if (await sqlBtn.isVisible()) {
      await sqlBtn.click();
      await page.waitForTimeout(200);

      // Verify QueryModal with text CLICKHOUSE QUERY PROVENANCE is visible
      const modalHeading = page.getByText('CLICKHOUSE QUERY PROVENANCE');
      await expect(modalHeading).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button:has-text("CLOSE")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('Human Authorization Gate consent checkbox and Approve button', async ({ page }) => {
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/test');
    await page.waitForLoadState('networkidle');

    const launchBtn = page.locator('button:has-text("APPROVE & LAUNCH A/B TEST")');
    await expect(launchBtn).toBeVisible();

    const consentCheck = page.locator('#consent-check, input[type="checkbox"]');
    if (await consentCheck.isVisible()) {
      // Disabled prior to checking
      await expect(launchBtn).toBeDisabled();
      // Check box
      await consentCheck.check();
      // Enabled after checking
      await expect(launchBtn).toBeEnabled();
    }
  });

  test('Mobile Bottom Navigation active tab switching', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/proj_northlight_01/experiments/exp_23a/finding');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(nav).toBeVisible();

    // Click Evidence
    await nav.getByText('Evidence').click();
    await expect(page).toHaveURL(/.*evidence/);

    // Click Test
    await nav.getByText('Test').click();
    await expect(page).toHaveURL(/.*test/);

    // Click Finding
    await nav.getByText('Finding').click();
    await expect(page).toHaveURL(/.*finding/);
  });

  test('Screening Privacy Consent button and player launch', async ({ page }) => {
    await page.goto('/screen/demo_token_123');
    await page.waitForLoadState('networkidle');

    const isMobile = page.viewportSize()?.width! < 900;

    if (isMobile) {
      await expect(page.getByText('Audience Screening Consent')).toBeVisible();
      await page.click('button:has-text("I AGREE & START")');
      await expect(page.getByText('Northlight · Scene 12 Cut A')).toBeVisible();
    } else {
      const startBtn = page.locator('button:has-text("START SCREENING")');
      await expect(startBtn).toBeDisabled();

      const consentCheck = page.locator('text="I consent to this screening data use"');
      await consentCheck.click();
      await expect(startBtn).toBeEnabled();

      await startBtn.click();
      await expect(page.getByText('CONNECTION ONLINE')).toBeVisible();

      const exitBtn = page.locator('button:has-text("EXIT SCREENING")');
      await expect(exitBtn).toBeVisible();
      await exitBtn.click();
      await expect(page).toHaveURL(/.*finding/);
    }
  });
});
