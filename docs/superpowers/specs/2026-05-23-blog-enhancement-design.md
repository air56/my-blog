# 博客 UI 增强设计规格

## 概述

为个人博客增加页面过渡动画、文章侧边栏装饰和滚动交互效果，延续 Endfield 暗色工业风设计语言。

## 1. 页面加载过渡动画

### 行为
- 点击文章卡片或内链后，立即触发全屏黑色遮罩
- 遮罩居中显示黄色（`#fffa00`）加载进度条，宽度非线性增长
- 页面加载完成后进度条跳到 100%，遮罩渐出
- 整体时长 400-800ms

### 技术方案
- 新建 `TransitionProvider` 客户端组件，在 `layout.tsx` 中包裹 `children`
- 利用 `usePathname()` 监听路由变化触发动画
- 遮罩：`position: fixed; inset: 0; z-index: 9999; background: #000`
- 进度条：`transform: scaleX()` + `transition` 驱动

## 2. 左侧装饰侧边栏

### 布局
- 文章详情页主容器改为 `display: flex`，左侧新增装饰栏（宽约 60px）
- 正文区域保持原有 720px 居中

### 装饰元素
- **黄色竖线**：1px 宽黄色竖线延伸贯穿
- **装饰方块组**：2-3 个黄/绿/粉色几何小方块，带半透明和斜线纹理，`position: sticky` 保持在视口
- **快速导航**：自动提取文章 h2 标题索引，点击跳转，Intersection Observer 高亮当前标题

## 3. 滚动交互动画

### 内容滚动触发
- 正文 `h2`、`p`、`blockquote`、`img` 等元素在进入视口时上滑 20px + 透明度 0→1
- Intersection Observer，`threshold: 0.1`，单次触发
- 过渡 `0.5s ease`，相邻元素延迟 `0.1s`

### Header 滚动变化
- 滚动超过 80px 后 Header 背景变为 `rgba(0, 0, 0, 0.9)` + 底部边框
- 返回顶部后恢复

### 阅读进度条
- Header 下方固定 1px 高黄色进度条，随滚动填充

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/components/TransitionProvider.tsx` | 新建 |
| `src/components/ScrollAnimProvider.tsx` | 新建 |
| `src/components/PostSidebar.tsx` | 新建 |
| `src/app/layout.tsx` | 添加 TransitionProvider |
| `src/app/posts/[slug]/page.tsx` | 添加侧边栏和滚动动画容器 |
| `src/styles/globals.css` | 新增滚动动画 CSS 变量 |
| `src/styles/TransitionProvider.module.css` | 新建 |
| `src/styles/PostSidebar.module.css` | 新建 |
| `src/styles/scroll-anim.css` | 新建 |
