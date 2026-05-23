# 博客 UI 增强实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为博客增加页面过渡动画、左侧装饰侧边栏和滚动交互效果，延续 Endfield 暗色工业风设计。

**架构：** 三个独立的新组件（TransitionProvider、PostSidebar、ScrollAnimProvider）分别负责加载动画、侧边栏和滚动效果，集成到 layout 和文章详情页中。

**技术栈：** Next.js 14 App Router、CSS Modules、Intersection Observer、CSS transitions

---

### 任务 1：TransitionProvider 页面加载过渡动画

**文件：**
- 创建：`src/components/TransitionProvider.tsx`
- 创建：`src/styles/TransitionProvider.module.css`
- 修改：`src/app/layout.tsx`

- [ ] **步骤 1：创建 TransitionProvider 组件**

`src/components/TransitionProvider.tsx`:
```tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import styles from '@/styles/TransitionProvider.module.css';

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    setVisible(true);
    setProgress(0);

    const t1 = setTimeout(() => setProgress(30), 40);
    const t2 = setTimeout(() => setProgress(55), 150);
    const t3 = setTimeout(() => setProgress(75), 300);
    const t4 = setTimeout(() => setProgress(88), 450);
    const t5 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setLoading(false);
      }, 350);
    }, 650);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5);
    };
  }, [pathname]);

  return (
    <>
      {visible && (
        <div className={`${styles.overlay} ${!loading ? styles.fadeOut : ''}`}
             style={{ pointerEvents: loading ? 'auto' : 'none' }}>
          <div className={styles.barTrack}>
            <div className={styles.bar} style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
```

- [ ] **步骤 2：创建过渡动画 CSS**

`src/styles/TransitionProvider.module.css`:
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

.fadeOut {
  opacity: 0;
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
  background: var(--accent-yellow);
  transform-origin: left;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 1px;
}
```

- [ ] **步骤 3：在 layout.tsx 中集成 TransitionProvider**

修改 `src/app/layout.tsx`：
```tsx
import TransitionProvider from '@/components/TransitionProvider';

// 在 body 内包裹：
<TransitionProvider>
  <Header />
  <main ...>
    {children}
  </main>
  <Footer />
</TransitionProvider>
```

- [ ] **步骤 4：Build 测试**

运行 `npm run build` 确认无错误。

- [ ] **步骤 5：Commit**

```bash
git add src/components/TransitionProvider.tsx src/styles/TransitionProvider.module.css src/app/layout.tsx
git commit -m "feat: add page transition loading overlay with yellow progress bar"
```

---

### 任务 2：PostSidebar 左侧装饰侧边栏

**文件：**
- 创建：`src/components/PostSidebar.tsx`
- 创建：`src/styles/PostSidebar.module.css`

- [ ] **步骤 1：创建 PostSidebar 组件**

`src/components/PostSidebar.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/PostSidebar.module.css';

type Heading = { id: string; text: string };

export default function PostSidebar({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    // Extract h2 headings from raw markdown
    const h2Regex = /^## (.+)$/gm;
    const extracted: Heading[] = [];
    let match: RegExpExecArray | null;
    while ((match = h2Regex.exec(content)) !== null) {
      const id = match[1]
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w一-鿿-]/g, '');
      extracted.push({ id, text: match[1] });
    }
    setHeadings(extracted);

    if (extracted.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    // Delay to wait for DOM rendering
    const timer = setTimeout(() => {
      for (const { id } of extracted) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className={styles.sidebar}>
      {/* Decorative elements */}
      <div className={styles.decorLine} />
      <div className={styles.decorBlock1} />
      <div className={styles.decorBlock2} />
      <div className={styles.decorBlock3} />

      {/* Quick nav */}
      {headings.length > 0 && (
        <nav className={styles.nav}>
          <span className={styles.navTitle}>目录</span>
          {headings.map((h) => (
            <button
              key={h.id}
              className={`${styles.navItem} ${activeId === h.id ? styles.navItemActive : ''}`}
              onClick={() => scrollTo(h.id)}
            >
              {h.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
```

- [ ] **步骤 2：创建侧边栏 CSS**

`src/styles/PostSidebar.module.css`:
```css
.sidebar {
  position: sticky;
  top: calc(var(--header-height) + var(--space-xl));
  width: 60px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding-top: var(--space-lg);
  height: fit-content;
  min-height: 200px;
}

/* Yellow vertical line */
.decorLine {
  width: 1px;
  flex: 1;
  min-height: 80px;
  background: linear-gradient(
    180deg,
    var(--accent-yellow) 0%,
    rgba(255, 250, 0, 0.2) 60%,
    transparent 100%
  );
}

/* Decorative blocks - Endfield style */
.decorBlock1 {
  width: 12px;
  height: 12px;
  background: var(--accent-yellow);
  opacity: 0.6;
  transform: rotate(45deg);
}

.decorBlock2 {
  width: 8px;
  height: 24px;
  background: var(--accent-green);
  opacity: 0.4;
  border-radius: 1px;
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 1px,
    rgba(0, 0, 0, 0.3) 1px,
    rgba(0, 0, 0, 0.3) 2px
  );
}

.decorBlock3 {
  width: 16px;
  height: 4px;
  background: var(--accent-pink);
  opacity: 0.3;
}

/* Quick navigation */
.nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  writing-mode: vertical-rl;
}

.navTitle {
  font-size: 0.625rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  margin-bottom: var(--space-xs);
}

.navItem {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-sans);
  letter-spacing: 0.05em;
  padding: 2px 0;
  transition: color var(--transition-fast);
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.navItem:hover {
  color: var(--accent-yellow);
}

.navItemActive {
  color: var(--accent-yellow);
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/PostSidebar.tsx src/styles/PostSidebar.module.css
git commit -m "feat: add decorative post sidebar with quick navigation"
```

---

### 任务 3：为文章 h2 标题添加 ID

**文件：**
- 修改：`src/app/posts/[slug]/page.tsx`

- [ ] **步骤 1：修改 post page 的 Markdown 渲染，为 h2 添加 ID**

在 `src/app/posts/[slug]/page.tsx` 中，修改 h2 替换逻辑：

```tsx
// 旧：
.replace(/^## (.+)$/gm, '<h2>$1</h2>')

// 新：
.replace(/^## (.+)$/gm, (_, title: string) => {
  const id = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-鿿-]/g, '');
  return `<h2 id="${id}">${title}</h2>`;
})
```

- [ ] **步骤 2：Build 测试**

运行 `npm run build` 确认无错误。

- [ ] **步骤 3：Commit**

```bash
git add src/app/posts/[slug]/page.tsx
git commit -m "feat: add id attributes to h2 headings for sidebar navigation"
```

---

### 任务 4：集成 PostSidebar 到文章详情页

**文件：**
- 修改：`src/app/posts/[slug]/page.tsx`

- [ ] **步骤 1：在 PostPage 中添加侧边栏和 flex 布局**

修改 `src/app/posts/[slug]/page.tsx`，导入 PostSidebar 并用 flex 容器包裹：

```tsx
import PostSidebar from '@/components/PostSidebar';

// 在 return 中，将 <article> 改为 flex 容器：
return (
  <div className={styles.pageLayout}>
    <PostSidebar content={post.content} />
    <article className={styles.container}>
      {/* 原有内容不变 */}
    </article>
  </div>
);
```

- [ ] **步骤 2：添加 pageLayout 样式**

在 `src/styles/PostDetail.module.css` 末尾添加：

```css
.pageLayout {
  display: flex;
  max-width: calc(720px + 60px + var(--space-xl));
  margin: 0 auto;
  padding: 0 var(--space-lg);
  gap: var(--space-lg);
}

/* 调整原 container 宽度 */
.container {
  max-width: 720px;
  margin: 0;  /* 改为 0 取消自动居中 */
  padding: var(--space-2xl) 0 var(--space-3xl);
  flex: 1;
  min-width: 0;
}
```

注意：`.container` 的 `margin: 0 auto` 改为 `margin: 0`，`padding` 去掉左右 padding（由 `.pageLayout` 控制）。

- [ ] **步骤 3：Build 测试**

运行 `npm run build` 确认无错误。

- [ ] **步骤 4：Commit**

```bash
git add src/app/posts/[slug]/page.tsx src/styles/PostDetail.module.css
git commit -m "feat: integrate PostSidebar into post detail page"
```

---

### 任务 5：ScrollAnimProvider 滚动动画

**文件：**
- 创建：`src/components/ScrollAnimProvider.tsx`
- 创建：`src/styles/scroll-anim.css`

- [ ] **步骤 1：创建 ScrollAnimProvider**

`src/components/ScrollAnimProvider.tsx`:
```tsx
'use client';

import { useEffect, useRef } from 'react';
import '@/styles/scroll-anim.css';

export default function ScrollAnimProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('.anim-fade-in');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('anim-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
```

- [ ] **步骤 2：创建滚动动画 CSS**

`src/styles/scroll-anim.css`:
```css
.anim-fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.anim-fade-in.anim-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered delay for consecutive elements */
.anim-fade-in:nth-child(2) { transition-delay: 0.05s; }
.anim-fade-in:nth-child(3) { transition-delay: 0.1s; }
.anim-fade-in:nth-child(4) { transition-delay: 0.15s; }
.anim-fade-in:nth-child(5) { transition-delay: 0.2s; }
.anim-fade-in:nth-child(6) { transition-delay: 0.25s; }
.anim-fade-in:nth-child(7) { transition-delay: 0.3s; }
.anim-fade-in:nth-child(8) { transition-delay: 0.35s; }
.anim-fade-in:nth-child(9) { transition-delay: 0.4s; }
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/ScrollAnimProvider.tsx src/styles/scroll-anim.css
git commit -m "feat: add scroll animation provider with fade-in-up effect"
```

---

### 任务 6：在文章详情页应用滚动动画

**文件：**
- 修改：`src/app/posts/[slug]/page.tsx`

- [ ] **步骤 1：在 post detail 中包裹内容区并添加 anim 类**

在 `src/app/posts/[slug]/page.tsx` 导入 ScrollAnimProvider，将文章内容区域（`.content`）包裹在 `ScrollAnimProvider` 中，并在动态渲染的 HTML 上添加 `class="anim-fade-in"`。

修改内容渲染部分，给每个 block 元素添加 anim 类。因为 `dangerouslySetInnerHTML` 不支持直接加类，改用 ScrollAnimProvider 包裹整个 `.content`，然后通过 CSS 让 `.content > *` 都获得 `anim-fade-in` 效果。

导入：
```tsx
import ScrollAnimProvider from '@/components/ScrollAnimProvider';
```

在 body 部分：
```tsx
<ScrollAnimProvider>
  <div className={styles.content} ...>
    ...
  </div>
</ScrollAnimProvider>
```

在 `scroll-anim.css` 中添加：
```css
/* Post detail content children get animation */
.contentAnim > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.contentAnim > *.anim-visible {
  opacity: 1;
  transform: translateY(0);
}
```

修改 `ScrollAnimProvider` 使其能通过 props 接受 CSS 选择器，或者更简单的：在 post detail 页面内容容器上加类 `.contentAnim`，然后在 `ScrollAnimProvider` 中观察 `.contentAnim > *`。

实际上更简单的方案：直接把 `ScrollAnimProvider` 改为接受选择器参数，或在 post page 中直接使用 client 组件处理。

让我简化方案——直接在 post detail 页面用 `'use client'` 内联处理内容动画，或者将 ScrollAnimProvider 设计得更通用。

建议：修改 ScrollAnimProvider 接受可选的 `selector` prop：

```tsx
export default function ScrollAnimProvider({ children, selector }: { children: React.ReactNode; selector?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(selector || '.anim-fade-in');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('anim-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector]);

  return <div ref={containerRef}>{children}</div>;
}
```

然后在 post detail 页面：
```tsx
<ScrollAnimProvider selector=".content > *">
  <div className={`${styles.content} contentAnim`}
    dangerouslySetInnerHTML={{ ... }}
  />
</ScrollAnimProvider>
```

在 `scroll-anim.css` 中添加：
```css
.contentAnim > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.contentAnim > *.anim-visible {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **步骤 2：Build 测试**

运行 `npm run build` 确认无错误。

- [ ] **步骤 3：Commit**

```bash
git add src/components/ScrollAnimProvider.tsx src/styles/scroll-anim.css src/app/posts/[slug]/page.tsx
git commit -m "feat: apply scroll animations to post content"
```

---

### 任务 7：Header 滚动效果与阅读进度条

**文件：**
- 修改：`src/components/Header.tsx`
- 修改：`src/styles/Header.module.css`
- 修改：`src/styles/globals.css`

- [ ] **步骤 1：修改 Header 组件添加滚动检测和阅读进度条**

`src/components/Header.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/Header.module.css';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/categories', label: '分类' },
  { href: '/search', label: '搜索' },
  { href: '/about', label: '关于' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 80);

      // Reading progress - only on post pages
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(scrollY / docHeight, 1);
        setReadProgress(progress);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Only show reading progress on post pages
  const isPostPage = pathname.startsWith('/posts/');

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoAccent}>◆</span> My Blog
          </Link>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {isPostPage && (
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ transform: `scaleX(${readProgress})` }} />
        </div>
      )}
    </>
  );
}
```

- [ ] **步骤 2：更新 Header CSS**

`src/styles/Header.module.css`，修改 `.header` 默认背景为透明，滚动后变半透明：

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: transparent;
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(12px);
  z-index: 100;
  transition: background var(--transition-normal), border-color var(--transition-normal);
}

.headerScrolled {
  background: rgba(0, 0, 0, 0.9);
  border-bottom-color: var(--border-color);
}
```

在末尾新增进度条样式：
```css
.progressTrack {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 250, 0, 0.1);
  z-index: 99;
}

.progressBar {
  height: 100%;
  width: 100%;
  background: var(--accent-yellow);
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.1s linear;
}
```

- [ ] **步骤 3：Build 测试**

运行 `npm run build` 确认无错误。

- [ ] **步骤 4：Commit**

```bash
git add src/components/Header.tsx src/styles/Header.module.css
git commit -m "feat: add header scroll effect and reading progress bar"
```
