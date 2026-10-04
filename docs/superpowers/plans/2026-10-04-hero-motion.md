# 首页图片动态效果实现计划

**目标：** 为现有海边插画增加柔和粒子、鼠标视差和缓慢呼吸。

**架构：** 独立 `HeroScene` 客户端组件管理 Canvas 与动画生命周期，首页继续使用服务端文章数据。专属 CSS 管理装饰层与呼吸效果，不引入运行时依赖。

**技术栈：** Next.js、React、Canvas 2D、CSS、Node test、Playwright（本地验证工具）。

## 步骤

- [x] 在 `scripts/hero-motion.test.mjs` 编写浏览器验收：真实像素变化、鼠标视差、滚出暂停与恢复、减少动态效果、触摸设备、无 JS。
- [x] 启动 `npm run dev -- --hostname 127.0.0.1 --port 3100`，运行 `node --test scripts/hero-motion.test.mjs`，确认新增装饰组件缺失导致失败。
- [x] 新建 `src/components/HeroScene.tsx` 和 `src/styles/HeroScene.module.css`，实现 Canvas、平滑视差、呼吸、监听与清理；在 `src/app/page.tsx` 替换静态背景层。
- [x] 浏览器验收通过并保存桌面与手机截图，检查构图、文本可读性和无横向溢出。
- [x] 运行 `npm run test:markdown`、`node --test scripts/learning-section.test.mjs`、`npm run lint`、`npm run build`、`git diff --check`。

浏览器测试使用 `HERO_TEST_URL` 指定目标（默认本地 3100 端口），`PLAYWRIGHT_MODULE` 可指向本地已有的 Playwright，`HERO_TEST_BROWSER` 可指定浏览器程序路径。无需更改项目依赖。

## 验证结果

浏览器验收 9/9、Markdown 测试 6/6、学习栏目测试 3/3 通过。生产构建生成 27 个静态页面。lint 无错误，存在原有 CommentSection.tsx:43 的 ref 清理警告。代码审查未发现阻塞问题。标签隐藏状态在无头浏览器中通过模拟 document.hidden 并派发真实 visibilitychange 事件验证；路由离开与返回在真实客户端导航中验证。
