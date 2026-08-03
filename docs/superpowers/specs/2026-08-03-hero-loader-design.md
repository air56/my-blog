---
title: 首页 Hero 图加载覆盖层设计
date: 2026-08-03
status: approved
---

# 首页 Hero 图加载覆盖层设计

## 背景

博客在手机端打开时，首页 Hero 背景图（`/my-blog/images/hero-bg.jpg`，约 465KB）加载缓慢，
移动端弱网下首屏会长时间显示空黑/部分图，体验差。

需求：图片加载完成前用进度条覆盖层挡住，加载成功后才显示主页内容。

## 目标

- 首页首屏：真实等待 Hero 图加载完成后再进入
- 视觉与现有全局页面切换过渡一致（细黄进度条 + 淡出）
- 最小改动，只影响首页，不触碰全局页面切换逻辑

## 非目标

- 不改动全局 `TransitionProvider`（页面切换逻辑保持现状）
- 不做多图预加载（只处理 hero 图）
- 不做图片压缩/转格式优化（`hero-bg.jpg` 465KB 可在后续单独优化）

## 架构

新增客户端组件 `HeroLoader.tsx`，仅包裹首页 Hero 区。

### 数据流

```
组件挂载
  └─ useState: idle
     └─ useEffect(一次) ── new Image() 预加载 hero-bg.jpg
          ├─ onload  → loading → done（淡出）
          └─ onerror → 直接放行（降级，不卡用户）
```

### 组件结构

- `HeroLoader`（`'use client'`）
  - 用 `useRef` 确保只触发一次加载
  - 状态机：`idle → loading → done`
  - 加载完成前渲染覆盖层；完成后渲染 `children`（真正的 Hero 内容）

## 详细设计

### 1. 图片加载检测

CSS `background-image` 无 `onload` 事件，采用 `new Image()` 预加载同源 URL：

```ts
const img = new Image();
img.src = '/my-blog/images/hero-bg.jpg';
img.onload = () => setStatus('done');
img.onerror = () => setStatus('done'); // 失败也放行，避免坏图卡死
```

**成功标准**：`onload` 触发时，图片已进入浏览器缓存，`background-image` 可立即渲染，无缝衔接。

### 2. 覆盖层视觉（复用现有样式）

复用 `TransitionProvider.module.css` 的 `.overlay` / `.fadeOut` / `.barTrack` / `.bar`：
- 黑色全屏覆盖层（`position: fixed`，`z-index: 9999`）
- 中间细黄进度条 + 左上角"✦ MY BLOG"标识（与原型一致）
- 加载完成后 `.fadeOut`（`opacity 0.35s ease`）淡出

由于 `.overlay` 等类在 `TransitionProvider.module.css` 中，HeroLoader 直接 import 复用该模块，避免重复定义。

### 3. 进度条动画

与原型及现有 TransitionProvider 一致的递增节奏，最后到 100% 后淡出。

### 4. 错误处理与降级

- 图片加载失败（`onerror`）：直接放行显示页面，Hero 区保持黑底（`background: #000`），不阻塞浏览
- 图加载成功：淡出覆盖层，露出带背景图的 Hero

### 5. 可访问性

- 覆盖层加 `aria-hidden="true"`
- `prefers-reduced-motion: reduce` 时跳过过渡动画（复用现有媒体查询）

## 文件改动

| 文件 | 动作 | 说明 |
|---|---|---|
| `src/components/HeroLoader.tsx` | 新增 | 客户端组件，加载覆盖层 + Hero 内容 |
| `src/styles/HeroLoader.module.css` | 新增 | 覆盖层专属样式（可复用时 import TransitionProvider 的） |
| `src/app/page.tsx` | 修改 | Hero 区包裹进 `<HeroLoader>` |
| `src/app/page.module.css` | 修改 | 调整 Hero 布局以配合包裹（如需） |

## 测试

- 构建：`npm run build` 通过
- 本地 `next dev` 打开首页，DevTools Network 限速模拟慢网络，验证：
  - 加载中：黑底 + ✦ MY BLOG + 黄色进度条
  - 加载完成：进度条到 100%，淡出，Hero 背景图显示
  - 断网/404 图：直接显示黑底页面，不卡死
  - `prefers-reduced-motion` 下无动画

## 风险与缓解

- **图已缓存**：二次访问时 `onload` 可能同步/极快触发，覆盖层可能一闪而过。缓解：不强制最低展示时长，以真实加载为准（用户已确认原型认可快速加载场景）。
- **影响现有全局过渡**：只包裹 Hero 区，不修改 `TransitionProvider`，无牵连。
