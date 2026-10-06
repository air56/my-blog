import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.HERO_TEST_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const url = process.env.MOTION_TEST_URL || 'http://127.0.0.1:3107/my-blog';
const screenshotDir = process.env.MOTION_SCREENSHOT_DIR;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });

test('主题切换和导航在浏览器中可用', async (t) => {
  const browser = await chromium.launch({ executablePath, headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${url}/categories`);
  await page.getByRole('heading', { name: '分类', exact: true }).waitFor();
  // Assert the missing feature immediately, so a red test is a clear assertion.
  assert.equal(await page.getByRole('button', { name: '切换到浅色模式' }).count(), 1);

  await t.test('日夜切换更新配色并在刷新后保留', async () => {
    const before = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole('button', { name: '切换到浅色模式' }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    assert.notEqual(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor), before);
    await page.reload();
    await page.getByRole('button', { name: '切换到深色模式' }).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'categories-light.png'), animations: 'disabled' });
  });

  await t.test('连续操作最终回到深色且不留动画遮挡', async () => {
    await page.evaluate(() => {
      const button = document.querySelector('[data-theme-toggle]');
      button.click(); button.click(); button.click();
    });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-theme-transition'));
    assert.ok(await page.getByRole('button', { name: '切换到浅色模式' }).isEnabled());
  });

  await t.test('导航高亮覆盖分类子页，返回正常', async () => {
    const nav = page.getByRole('navigation', { name: '主导航' });
    await page.locator('main a[href*="/categories/"]').first().click();
    await page.waitForFunction(() => decodeURIComponent(location.pathname).split('/').length > 3);
    assert.equal(await nav.getByRole('link', { name: '分类', exact: true }).getAttribute('aria-current'), 'page');
    await page.goBack();
    await page.waitForURL(`${url}/categories`);
    const indicator = nav.locator('[data-nav-indicator]');
    await indicator.waitFor({ state: 'visible' });
    const line = await indicator.boundingBox();
    const link = await nav.getByRole('link', { name: '分类', exact: true }).boundingBox();
    assert.ok(Math.abs(line.x - link.x) < 2 && Math.abs(line.width - link.width) < 2);
  });

  await t.test('减少动态效果与 API 不支持时仍能切换', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: '切换到浅色模式' }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    assert.equal(await page.locator('html').getAttribute('data-theme-transition'), null);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => { document.startViewTransition = undefined; });
    await page.getByRole('button', { name: '切换到深色模式' }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'categories-dark.png'), animations: 'disabled' });
  });

  await t.test('手机和窄屏导航不溢出', async () => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      for (const name of ['首页', '分类', '搜索', '学习', '关于']) {
        assert.ok(await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name, exact: true }).isVisible());
      }
      if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, `categories-mobile-${width}.png`), animations: 'disabled' });
    }
  });
  assert.deepEqual(errors, []);
});
