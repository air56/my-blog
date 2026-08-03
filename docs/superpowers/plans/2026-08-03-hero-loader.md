# 首页 Hero 图加载覆盖层实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 首页 Hero 背景图（`/my-blog/images/hero-bg.jpg`）加载完成前，用黑色进度条覆盖层挡住首屏；真实加载完成（或失败降级）后淡出，露出主页内容。只在首页生效，不影响全局页面切换。

**架构：** 新增客户端组件 `HeroLoader.tsx` 包裹首页 Hero 区。组件挂载后用 `new Image()` 预加载 hero 图，`onload`/`onerror` 都触发放行（失败降级为黑底不卡死）。覆盖层视觉复用现有 `TransitionProvider.module.css` 的 `.overlay`/`.barTrack`/`.bar` 样式，保证与页面切换过渡观感一致。

**技术栈：** Next.js 14（App Router）、React 18、CSS Modules。

**设计文档：** `docs/superpowers/specs/2026-08-03-hero-loader-design.md`

---

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `src/components/HeroLoader.tsx` | 客户端组件：图片预加载 + 覆盖层状态机 + 渲染 children | 创建 |
| `src/styles/HeroLoader.module.css` | 覆盖层专属样式（复用 `.overlay` 时也 import TransitionProvider） | 创建 |
| `src/app/page.tsx` | 首页：把 Hero 区内容包进 `<HeroLoader>` | 修改 |
| `src/app/page.module.css` | 如需微调 Hero 布局以配合包裹 | 修改（可能不动） |

---

### 任务 1：HeroLoader 组件

> 本项目无 Jest/Testing Library 测试基础设施（devDependencies 仅 typescript/eslint）。验证采用：`npm run build` 类型/构建校验 + `next dev` DevTools 限速视觉验证。

**文件：**
- 创建：`src/components/HeroLoader.tsx`
- 创建：`src/styles/HeroLoader.module.css`

- [ ] **步骤 1：编写组件**

`src/components/HeroLoader.tsx`：

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/HeroLoader.module.css';

export default function HeroLoader({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'done'>('loading');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const img = new Image();
    img.src = '/my-blog/images/hero-bg.jpg';
    img.onload = () => setStatus('done');
    img.onerror = () => setStatus('done'); // 失败也放行，黑底降级
  }, []);

  return (
    <>
      {status === 'loading' && (
        <div aria-hidden="true" className={styles.overlay}>
          <div className={styles.barTrack}>
            <div className={styles.bar} />
          </div>
        </div>
      )}
      <div className={status === 'loading' ? styles.hidden : styles.visible}>
        {children}
      </div>
    </>
  );
}
```

`src/styles/HeroLoader.module.css`：

```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.35s ease;
}

.barTrack {
  width: 240px;
  height: 2px;
  background: rgba(255, 250, 0, 0.15);
  border-radius: 1px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #fffa00;
  transform-origin: left;
  animation: loading 0.9s ease-in-out infinite;
  border-radius: 1px;
}

@keyframes loading {
  0% { transform: scaleX(0); }
  60% { transform: scaleX(0.6); }
  100% { transform: scaleX(1); }
}

.hidden {
  opacity: 0;
  visibility: hidden;
}

.visible {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    animation: none;
    transform: scaleX(0.7);
  }
  .overlay, .visible {
    transition: none;
  }
}
```

- [ ] **步骤 2：构建验证**

运行：`npm run build`
预期：PASS — 类型/构建无错，`/` 正常生成

- [ ] **步骤 3：Commit**

```bash
git add src/components/HeroLoader.tsx src/styles/HeroLoader.module.css
git commit -m "feat: 首页 hero 加载覆盖层组件"
```

---

### 任务 2：接入首页 Hero 区

**文件：**
- 修改：`src/app/page.tsx:10-52`（Hero section）

- [ ] **步骤 1：把 Hero 区包进 HeroLoader**

修改 `src/app/page.tsx`：

```tsx
import { getAllPosts, getAllCategories } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import HeroLoader from '@/components/HeroLoader';
import styles from './page.module.css';

export default function HomePage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <>
      {/* Hero */}
      <HeroLoader>
        <section className={styles.hero}>
          {/* ...原 Hero 区内容不变... */}
        </section>
      </HeroLoader>
      {/* Posts 区不变 */}
    </>
  );
}
```

- [ ] **步骤 2：构建验证**

运行：`npm run build`
预期：PASS — 20/20 页面生成，`/` 正常

- [ ] **步骤 3：本地视觉验证**

运行：`npx next dev -p 4573`，打开 `http://localhost:4573/my-blog/`
预期：
- 加载中：黑底 + 进度条，看不到 Hero 内容
- DevTools Network 限速，等图加载完 → 进度条动画 → Hero 背景图淡入显示

- [ ] **步骤 4：Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: 首页 hero 接入加载覆盖层"
```

---

### 任务 3：失败降级验证

- [ ] **步骤 1：临时改坏图片 URL 测试降级**

临时把 `HeroLoader.tsx` 的 `img.src` 改为 `'/my-blog/images/does-not-exist.jpg'`：
运行：`npx next dev`，打开首页
预期：图 404 → `onerror` 触发 → 直接显示页面（黑底 Hero），不卡死、无进度条卡住

- [ ] **步骤 2：恢复正确 URL**

恢复 `img.src = '/my-blog/images/hero-bg.jpg'`，重新构建确认正常。

- [ ] **步骤 3：Commit（如有改动）**

---

### 任务 4：终验与部署

- [ ] **步骤 1：完整构建**

运行：`npm run build`
预期：PASS

- [ ] **步骤 2：移动端模拟**

运行：`npx next dev`，DevTools 设备模拟 iPhone，Network 设 Slow 3G
预期：加载中显示覆盖层，加载完淡出，Hero 图正常

- [ ] **步骤 3：push 触发部署**

```bash
git add -A
git commit -m "feat: 首页 hero 图加载覆盖层"
git push origin master
```

预期：push 到 master，GitHub Actions 自动部署
