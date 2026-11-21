import { test, expect } from '@playwright/test';

async function dismissWelcome(page: import('@playwright/test').Page) {
  const continueBtn = page.getByRole('button', { name: /Continue|Продолжить|Start|Начать/i });
  if (await continueBtn.isVisible().catch(() => false)) {
    await continueBtn.click();
  }
}

test.describe('ARGUS smoke', () => {
  test('loads shell and shows ARGUS branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const argus = page.getByText('ARGUS', { exact: false }).first();
    await expect(argus).toBeVisible({ timeout: 30_000 });
  });

  test('can dismiss welcome and see graph area', async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    await expect(page.locator('.graph-surface, .react-flow, #root')).toBeVisible({ timeout: 15_000 });
  });

  test('canvas toolbar is present after welcome', async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    await expect(page.locator('.canvas-toolbar')).toBeVisible({ timeout: 15_000 });
  });

  test('whiteboard bar renders undo control', async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    const undo = page.locator('.whiteboard-bar button[title*="Undo"], .whiteboard-bar button[title*="Ctrl+Z"]').first();
    await expect(undo).toBeVisible({ timeout: 15_000 });
  });

  test('keyboard tool switch to select (V) does not crash', async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    await page.keyboard.press('v');
    await expect(page.locator('body')).toBeVisible();
  });
});
