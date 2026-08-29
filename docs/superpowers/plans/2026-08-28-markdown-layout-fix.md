# Markdown 文章渲染与布局修复实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans（当前会话内联执行）。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复文章页的 Markdown 解析和代码块布局，使 `wsl-astrbot-bangumi` 及其他文章生成合法、整洁且可导航的 HTML。

**架构：** 将 Markdown 解析从文章页面组件中抽离到 `src/lib/markdown.js`，使用 `marked` 统一生成 HTML，并由独立的标题 slug 工具与目录侧栏共享标题 ID 规则。页面组件只负责读取文章并渲染结果，CSS 负责约束代码块和表格的布局。

**技术栈：** Next.js 14、React 18、Marked、Node.js 内置 `node:test`、现有 CSS Modules。

---

## 文件清单

- 创建：`src/lib/heading.js` —— 统一生成标题 ID。
- 创建：`src/lib/markdown.js` —— 标准 Markdown 到 HTML 的服务端渲染器。
- 修改：`src/app/posts/[slug]/page.tsx` —— 移除正则替换链，调用渲染器。
- 修改：`src/components/PostSidebar.tsx` —— 复用统一标题 ID 规则。
- 修改：`src/styles/PostDetail.module.css` —— 补充代码块、表格和移动端布局约束。
- 修改：`package.json`、`package-lock.json` —— 添加 `marked` 运行依赖和测试脚本。
- 创建：`scripts/markdown-render.test.mjs` —— Markdown 结构回归测试。
- 创建：`docs/superpowers/specs/2026-08-28-markdown-layout-fix-design.md` —— 已确认的设计说明。

## 任务 1：建立 Markdown 回归测试

**文件：** `scripts/markdown-render.test.mjs`

- [ ] 编写测试，覆盖标题、代码块、行内代码、列表、引用和表格。
- [ ] 明确断言代码围栏输出 `<pre><code>`，代码内部不出现 `<p>`，并保留 `language-powershell` 等语言类名。
- [ ] 添加脚本 `test:markdown`，使用 `node --test scripts/markdown-render.test.mjs`。
- [ ] 运行测试并确认它因渲染器尚未存在而失败。

## 任务 2：实现标准 Markdown 渲染器

**文件：** `src/lib/heading.js`、`src/lib/markdown.js`、`package.json`、`package-lock.json`

- [ ] 添加 `marked` 依赖。
- [ ] 实现 `slugifyHeading(text)`，保留中文、字母、数字、下划线和连字符，并与现有目录规则一致。
- [ ] 配置 `marked` 使用 GFM 和自定义 heading renderer，确保生成的标题 ID 可被目录侧栏定位。
- [ ] 导出 `renderMarkdown(content)`，同步返回 HTML 字符串。
- [ ] 运行回归测试并确认通过。

## 任务 3：接入文章页并统一目录定位

**文件：** `src/app/posts/[slug]/page.tsx`、`src/components/PostSidebar.tsx`

- [ ] 用 `renderMarkdown(post.content)` 替换整段正则替换链。
- [ ] 让目录侧栏调用 `slugifyHeading`，消除渲染器和目录 ID 不一致风险。
- [ ] 保持文章元信息、标签、评论和页面结构不变。
- [ ] 运行 Markdown 回归测试，确认渲染入口没有回归。

## 任务 4：调整内容布局样式

**文件：** `src/styles/PostDetail.module.css`

- [ ] 确保 `pre` 使用 `white-space: pre`、`overflow-x: auto` 和稳定的内边距。
- [ ] 让代码块内的 `code` 不继承行内代码背景与内边距。
- [ ] 添加表格横向滚动容器所需的最大宽度约束，并保持正文不被长表格撑破。
- [ ] 在窄屏下收紧正文和代码块间距，不改变桌面端侧栏结构。

## 任务 5：验证与发布准备

**文件：** 生成目录和工作树

- [ ] 运行 `npm run test:markdown`。
- [ ] 运行 `npm run lint`；若 Next 版本不支持该命令，改用项目可用的 ESLint 命令并记录结果。
- [ ] 运行 `npm run build`，确认 `out/posts/wsl-astrbot-bangumi.html` 成功生成。
- [ ] 检查生成 HTML：代码块为合法 `<pre><code>`，不存在代码块内 `<p>`、裸围栏反引号或未包裹的列表项。
- [ ] 检查 `git diff` 和 `git status`，确认只包含本次修复相关文件。
- [ ] 如当前环境具备远程仓库凭据，再将修复提交到 `master` 触发 GitHub Pages；否则保留可发布工作树并明确说明发布阻塞点。