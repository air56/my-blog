'use client';

import { useEffect, useRef } from 'react';
import { commentConfig } from '@/lib/comment';
import styles from '@/styles/CommentSection.module.css';

export default function CommentSection() {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const { repo, repoId, category, categoryId, mapping, reactionsEnabled, inputPosition, theme, lang } = commentConfig;

    // 未配置时静默隐藏
    if (!repoId || !categoryId) return;

    initialized.current = true;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', reactionsEnabled);
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    ref.current?.appendChild(script);

    return () => {
      // 清理 script 和 giscus 生成的 iframe
      script.remove();
      ref.current?.querySelector('iframe')?.remove();
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.divider} />
      <h2 className={styles.heading}>💬 评论</h2>
      <p className={styles.tip}>
        评论基于 GitHub Discussions。每条评论都存储在你的仓库中。
      </p>
      <div ref={ref} className={styles.wrapper} />
    </section>
  );
}
