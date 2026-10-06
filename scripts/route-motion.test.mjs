import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const executablePath = process.env.ROUTE_TEST_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const url = process.env.ROUTE_TEST_URL || 'http://127.0.0.1:3107/my-blog';

async function settle(page) {
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(1100);
}

async function recordMotion(page) {
  await page.evaluate(() => {
    window.routeSamples = [];
    window.routeSampling = true;
    const sample = () => {
      if (!window.routeSampling) return;
      const main = document.querySelector('main');
      const header = document.querySelector('header');
      const style = getComputedStyle(main);
      const headerStyle = getComputedStyle(header);
      const headerRect = header.getBoundingClientRect();
      const transform = new DOMMatrixReadOnly(style.transform);
      const blocker = [...document.querySelectorAll('[aria-hidden="true"]')].some((element) => {
        const candidate = getComputedStyle(element);
        return candidate.position === 'fixed' && Number(candidate.zIndex) >= 9999;
      });
      window.routeSamples.push({
        opacity: Number(style.opacity),
        y: transform.m42,
        blur: parseFloat(style.filter.match(/blur\((.+)px\)/)?.[1] || '0'),
        headerY: headerRect.y,
        headerOpacity: Number(headerStyle.opacity),
        headerTransform: headerStyle.transform,
        blocker,
      });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function readMotion(page) {
  return page.evaluate(() => {
    window.routeSampling = false;
    return window.routeSamples;
  });
}

async function assertReadable(page) {
  const state = await page.locator('main').evaluate((main) => {
    const style = getComputedStyle(main);
    return { opacity: style.opacity, transform: style.transform, filter: style.filter, visibility: style.visibility };
  });
  assert.deepEqual(state, { opacity: '1', transform: 'none', filter: 'none', visibility: 'visible' });
  assert.ok(await page.getByRole('heading', { level: 1 }).isVisible());
}

test('柔和景深路由切换的浏览器验收', async (t) => {
  const browser = await chromium.launch({ executablePath, headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await settle(page);

  await t.test('正文景深入场，导航固定且没有全屏遮罩', async () => {
    await recordMotion(page);
    await page.getByRole('link', { name: '分类', exact: true }).first().click();
    await page.waitForURL('**/categories');
    await page.waitForTimeout(650);
    const samples = await readMotion(page);
    assert.ok(samples.some(({ blur, y, opacity }) => blur > 0.1 && y > 0.5 && opacity < 1),
      '路由正文应有轻微模糊、向上归位和淡入');
    assert.ok(samples.every(({ y, blur }) => y <= 12.1 && blur <= 3.1), '位移和模糊应保持克制');
    assert.ok(samples.every(({ headerY, headerOpacity, headerTransform }) =>
      headerY === 0 && headerOpacity === 1 && headerTransform === 'none'), '顶部导航应始终稳定可用');
    assert.ok(samples.every(({ blocker }) => !blocker), '路由切换不应再创建全屏加载遮罩');
    await assertReadable(page);
  });

  await t.test('同页链接与锚点不触发正文离场', async () => {
    await recordMotion(page);
    await page.getByRole('link', { name: '分类', exact: true }).first().click();
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '#route-motion-check';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
    await page.waitForTimeout(240);
    const samples = await readMotion(page);
    assert.ok(samples.every(({ opacity, y, blur }) => opacity === 1 && y === 0 && blur === 0));
    await assertReadable(page);
  });

  await t.test('快速导航、历史后退和未完成导航后正文可读', async () => {
    await page.getByRole('link', { name: '搜索', exact: true }).first().click();
    await page.getByRole('link', { name: '关于', exact: true }).first().click();
    await page.waitForURL('**/about');
    await page.waitForTimeout(550);
    await assertReadable(page);
    await page.goBack();
    await page.waitForTimeout(550);
    await assertReadable(page);
    // Keep this navigation from completing, as if an application handler or request failed.
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = `${location.pathname}/unavailable`;
      link.addEventListener('click', (event) => event.preventDefault());
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
    await page.waitForTimeout(550);
    await assertReadable(page);
  });

  await t.test('减少动态效果时路由立即保持静态', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await recordMotion(page);
    await page.getByRole('link', { name: '首页', exact: true }).first().click();
    await page.waitForURL(url);
    await page.waitForTimeout(180);
    const samples = await readMotion(page);
    assert.ok(samples.every(({ opacity, y, blur, blocker }) =>
      opacity === 1 && y === 0 && blur === 0 && !blocker), '减少动态效果模式不应出现切换动画或遮罩');
    await assertReadable(page);
  });

  await t.test('首页背景加载缓慢或失败均不阻塞内容', async () => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const tab = await context.newPage();
    await tab.route('**/hero-bg.jpg', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.abort();
    });
    await tab.goto(url, { waitUntil: 'domcontentloaded' });
    await tab.waitForTimeout(200);
    assert.ok(await tab.getByRole('heading', { level: 1 }).isVisible(), '背景未加载时标题也应可见');
    const covered = await tab.getByRole('heading', { level: 1 }).evaluate((heading) => {
      const { x, y, width, height } = heading.getBoundingClientRect();
      const top = document.elementFromPoint(x + width / 2, y + height / 2);
      return top !== heading && !heading.contains(top);
    });
    assert.equal(covered, false, '首页标题不应被加载遮罩覆盖');
    await tab.waitForTimeout(700);
    await assertReadable(tab);
    await context.close();
  });

  await t.test('禁用 JavaScript 后首页内容仍直接可读', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    const tab = await context.newPage();
    await tab.goto(url);
    await assertReadable(tab);
    await context.close();
  });

  assert.deepEqual(errors, []);
});
