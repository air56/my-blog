# 动效预览验证记录

日期：2026-10-06。分支：`codex/refined-motion-preview`，基于 `master` 的 `9fb3f93`。用户已确认浏览器预览并授权将改动推送至 `master`。

## 本地体验

```powershell
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3107
```

浏览器打开 <http://127.0.0.1:3107/my-blog>。点击导航、分类、文章，以及右上角日夜按钮体验动效。开启系统减少动态效果可检查静态降级。

## 验证结果

- `npm run build`：成功静态导出 27 个页面；包含中文分类产物。
- `npm run lint`：成功退出；仅保留原有 `CommentSection.tsx:43` 的 effect 清理引用警告。
- `npm run test:markdown`：6/6 通过。
- `npm run test:motion`：13/13 通过（包含父测试）；路由和主题测试在实现前均确认失败。
- `scripts/hero-motion.test.mjs`：9/9 通过（包含父测试）。
- 首页位置测试先等待路由入场完成再采样，避免把未结束的景深动画产生的浮点坐标差当作视差引起的标题漂移。
- 独立审查未发现阻塞问题；审查发现的减少动态效果进度条规则优先级问题已修正。
- Chrome 检查：快速导航、历史后退、锚点、图片加载失败、无 JS、320/390px 布局、主题持久化、API 降级；额外故障注入检查存储异常、API 抛错和 Promise 拒绝。
- Safari / Firefox 未实机验证；不支持 View Transition 的浏览器即时切换主题。

运行浏览器测试需要已有 Playwright，可通过 `PLAYWRIGHT_MODULE` 指向本机安装；`HERO_TEST_BROWSER` / `ROUTE_TEST_BROWSER` 可指定 Chromium 路径。URL 分别用 `MOTION_TEST_URL`、`ROUTE_TEST_URL`、`HERO_TEST_URL` 配置。

本机复现：

```powershell
$env:PLAYWRIGHT_MODULE='C:\Users\lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:HERO_TEST_URL='http://127.0.0.1:3107/my-blog'
npm run test:motion
node --test scripts/hero-motion.test.mjs
```

## 兼容修正

Next 14.2.35 的开发模式在 `output: export` 下将编码中文 URL 和未编码静态参数比较，导致分类子页 500。`next.config.js` 现在仅在生产阶段开启静态导出，保留原有 GitHub Pages 构建方式。修改前浏览器测试复现，修改后分类子页通过。

主题效果遵循 [MDN 的 View Transition API 用法](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)，检查 API 能力、处理跳过和拒绝、不支持时即时更新。

截图保存在忽略目录 `.superpowers/motion-preview/`。用户指定的 vision.js 识图服务返回余额不足，截图改由内置图像查看与浏览器布局测量核验。
