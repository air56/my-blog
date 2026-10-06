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
const url = process.env.HERO_TEST_URL || 'http://127.0.0.1:3100/my-blog';

async function waitForEntrance(page) {
  await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
  // Wait for hydration and the finite route entrance before sampling geometry.
  // The hero background itself intentionally keeps animating.
  await page.waitForFunction(() => ['active', 'reduced'].includes(
    document.querySelector('[data-hero-scene]')?.dataset.motion
  ));
  await page.locator('main').evaluate(async (main) => {
    await Promise.all(main.getAnimations().map((animation) => animation.finished.catch(() => {})));
  });
  await page.waitForFunction(() => ![...document.querySelectorAll('[aria-hidden="true"]')].some((el) => {
    const style = getComputedStyle(el);
    return style.position === 'fixed' && Number(style.zIndex) >= 9999;
  }));
}

test('首页动态装饰的浏览器验收', async (t) => {
  const browser = await chromium.launch({ executablePath, headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await waitForEntrance(page);
  assert.equal(await page.locator('[data-hero-scene]').count(), 1,
    '首页应有独立的粒子与动态背景层');

  const scene = page.locator('[data-hero-scene]');
  const pixels = () => scene.locator('canvas').evaluate((canvas) => canvas.toDataURL());
  const active = () => page.waitForFunction(() =>
    document.querySelector('[data-hero-scene]')?.dataset.motion === 'active');
  await active();

  await t.test('装饰不拦截交互，Canvas 持续绘制可见粒子', async () => {
    assert.equal(await scene.getAttribute('aria-hidden'), 'true');
    assert.equal(await scene.evaluate((el) => getComputedStyle(el).pointerEvents), 'none');
    const filled = await scene.locator('canvas').evaluate((canvas) => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return data.some((value, index) => index % 4 === 3 && value > 0);
    });
    assert.ok(filled, '粒子应产生真实像素');
    const before = await pixels();
    await page.waitForTimeout(180);
    assert.notEqual(await pixels(), before, '粒子应随时间移动');
  });

  await t.test('鼠标移动产生轻微视差，标题位置稳定', async () => {
    const title = page.getByRole('heading', { level: 1 });
    const before = await title.boundingBox();
    const frame = scene.locator('[data-hero-image-frame]');
    await page.mouse.move(720, 400);
    await page.waitForTimeout(300);
    const center = await frame.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.move(1250, 250);
    await page.waitForTimeout(450);
    const moved = await frame.evaluate((el) => getComputedStyle(el).transform);
    assert.notEqual(moved, center);
    const matrix = moved.match(/matrix\((.+)\)/)[1].split(',').map(Number);
    assert.ok(Math.abs(matrix[4]) <= 8 && Math.abs(matrix[5]) <= 8);
    assert.deepEqual(await title.boundingBox(), before);
  });

  await t.test('滚出首屏停止绘制，返回恢复动画', async () => {
    await page.getByRole('heading', { name: '最新文章' }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, window.innerHeight + 150));
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]')?.dataset.motion === 'paused');
    const before = await pixels();
    await page.waitForTimeout(180);
    assert.equal(await pixels(), before);
    assert.equal(await scene.locator('[data-hero-image]').evaluate((el) => getComputedStyle(el).animationPlayState), 'paused');
    await page.evaluate(() => window.scrollTo(0, 0));
    await active();
    await page.waitForTimeout(180);
    assert.notEqual(await pixels(), before);
  });

  await t.test('标签可见性事件驱动暂停与恢复', async () => {
    // Headless Chrome's CDP freeze does not change document.hidden.
    // Supply the browser visibility state while exercising the real listeners.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    let before;
    try {
      assert.equal(await scene.getAttribute('data-motion'), 'paused');
      before = await pixels();
      await page.waitForTimeout(180);
      assert.equal(await pixels(), before);
    } finally {
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await active();
    await page.waitForTimeout(180);
    assert.notEqual(await pixels(), before);
  });

  await t.test('减少动态效果时清空粒子并关闭图片动画，再切换可恢复', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]')?.dataset.motion === 'reduced');
    assert.equal(await scene.locator('[data-hero-image]').evaluate((el) => getComputedStyle(el).animationName), 'none');
    assert.equal(await scene.locator('[data-hero-image-frame]').evaluate((el) => getComputedStyle(el).transform), 'none');
    assert.ok(await scene.locator('canvas').evaluate((canvas) => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return data.every((value) => value === 0);
    }));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await active();
  });

  await t.test('手机适配与触摸不触发视差', async () => {
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const tab = await mobile.newPage();
    await tab.goto(url);
    await waitForEntrance(tab);
    await tab.waitForFunction(() => document.querySelector('[data-hero-scene]')?.dataset.motion === 'active');
    assert.ok(await tab.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert.equal(await tab.locator('canvas').evaluate((el) => el.width), 780);
    await tab.touchscreen.tap(300, 300);
    await tab.waitForTimeout(120);
    assert.equal(await tab.locator('[data-hero-image-frame]').evaluate((el) => getComputedStyle(el).transform), 'none');
    if (process.env.HERO_SCREENSHOT_DIR) {
      mkdirSync(process.env.HERO_SCREENSHOT_DIR, { recursive: true });
      await tab.screenshot({ path: path.join(process.env.HERO_SCREENSHOT_DIR, 'hero-mobile.png') });
    }
    await mobile.close();
  });

  await t.test('无 JS 时背景和首页文字仍可见', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const tab = await context.newPage();
    await tab.goto(url);
    assert.ok(await tab.getByRole('heading', { level: 1 }).isVisible());
    assert.match(await tab.locator('[data-hero-image]').evaluate((el) => getComputedStyle(el).backgroundImage), /hero-bg\.jpg/);
    assert.equal(await tab.locator('[data-hero-image]').evaluate((el) => getComputedStyle(el).animationPlayState), 'paused');
    await context.close();
  });

  await t.test('客户端离开首页清理旧动画，返回首页可重新启动', async () => {
    const oldCanvas = await scene.locator('canvas').elementHandle();
    await page.getByRole('link', { name: '分类', exact: true }).first().click();
    await page.waitForURL('**/categories');
    assert.equal(await oldCanvas.evaluate((canvas) => canvas.isConnected), false);
    const before = await oldCanvas.evaluate((canvas) => canvas.toDataURL());
    await page.waitForTimeout(180);
    assert.equal(await oldCanvas.evaluate((canvas) => canvas.toDataURL()), before);
    await oldCanvas.dispose();
    await page.getByRole('link', { name: '首页', exact: true }).first().click();
    await page.waitForURL(url);
    await waitForEntrance(page);
    await active();
    const restored = await pixels();
    await page.waitForTimeout(180);
    assert.notEqual(await pixels(), restored);
  });

  assert.deepEqual(errors, []);
  if (process.env.HERO_SCREENSHOT_DIR) {
    mkdirSync(process.env.HERO_SCREENSHOT_DIR, { recursive: true });
    await page.mouse.move(720, 400);
    await page.screenshot({ path: path.join(process.env.HERO_SCREENSHOT_DIR, 'hero-desktop.png') });
  }
});
