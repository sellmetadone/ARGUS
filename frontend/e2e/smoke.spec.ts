import { test, expect } from '@playwright/test';

test.describe('ARGUS smoke', () => {
  test('loads shell and shows ARGUS branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const argus = page.getByText('ARGUS', { exact: false }).first();
    await expect(argus).toBeVisible({ timeout: 30_000 });
  });

  test('can dismiss welcome and see graph area', async ({ page }) => {
    await page.goto('/');
    const continueBtn = page.getByRole('button', { name: /Continue|Продолжить/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    }
    await expect(page.locator('.graph-surface, .react-flow, #root')).toBeVisible({ timeout: 15_000 });
  });

  test('canvas toolbar is present after welcome', async ({ page }) => {
    await page.goto('/');
    const continueBtn = page.getByRole('button', { name: /Continue|Продолжить/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    }
    await expect(page.locator('.canvas-toolbar')).toBeVisible({ timeout: 15_000 });
  });
});
