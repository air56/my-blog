# 柔和景深预览实现计划

> 执行：当前隔离工作区内，主代理处理主题与导航，子代理处理独立的页面切换；最后审查并浏览器验收。

**目标：** 在现有博客上提供可操作的本地动效预览，用户确认前不推送。

**架构：** 保持 Next App Router；TransitionProvider 只动画正文，Header 提供栏目跟随与主题按钮，CSS 变量维护两种阅读配色。

**技术栈：** Next.js 14、React 18、TypeScript、CSS Modules、原生动画、Playwright 浏览器验证。

- [x] 先写 scripts/route-motion.test.mjs 和 scripts/theme-navigation.test.mjs，运行浏览器测试确认原有遮罩与缺失主题按钮导致失败。
- [x] 在 TransitionProvider 与 HeroLoader 内实现非阻塞入场，验证快速导航、后退及减少动态效果。
- [x] Header 增加可访问主题按钮、栏目滑动指示线与手机布局；ThemeToggle 隔离主题切换和清理；globals.css 增加暖白配色与圆形揭示动画。
- [x] PostCard / Categories 样式增加 3px 抬升与键盘反馈，减少动态效果时静态。
- [x] 运行 `npm run test:markdown`、浏览器动效测试、`npm run lint`、`npm run build`；检查桌面和手机截图。
- [x] 独立代码审查，打开 `http://127.0.0.1:3107/my-blog` 供用户确认。预览保持本地，无 commit 或 push。
