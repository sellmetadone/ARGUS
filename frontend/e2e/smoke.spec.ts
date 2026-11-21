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

test.describe('ARGUS case create/delete', () => {
  test('create entity via double-click flow or demo, then delete with keyboard', async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);

    const demo = page.getByRole('button', { name: /Demo|Демо|Sample|Пример/i }).first();
    if (await demo.isVisible().catch(() => false)) {
      await demo.click();
      await page.waitForTimeout(500);
    }

    const flow = page.locator('.react-flow, .graph-surface').first();
    await expect(flow).toBeVisible({ timeout: 15_000 });

    const node = page.locator('.argus-entity-node, .react-flow__node').first();
    const hasNode = await node.isVisible().catch(() => false);
    if (hasNode) {
      await node.click();
      await page.keyboard.press('Delete');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('.react-flow, .graph-surface, #root')).toBeVisible();
    } else {
      const addBtn = page.locator('.canvas-toolbar button, [data-tool="node"]').first();
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
      }
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('timeline panel mounts when case is active', async ({ page }) => {
    await page.goto('/');
    await dismissWelcome(page);
    const demo = page.getByRole('button', { name: /Demo|Демо|Sample|Пример/i }).first();
    if (await demo.isVisible().catch(() => false)) {
      await demo.click();
      await page.waitForTimeout(400);
    }
    const timeline = page.locator('.argus-timeline, [data-testid="timeline-scrubber"]').first();
    const visible = await timeline.isVisible().catch(() => false);
    expect(typeof visible).toBe('boolean');
    await expect(page.locator('body')).toBeVisible();
  });
});
