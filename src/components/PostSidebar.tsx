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
