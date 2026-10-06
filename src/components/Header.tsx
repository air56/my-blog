'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import styles from '@/styles/Header.module.css';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/categories', label: '分类' },
  { href: '/search', label: '搜索' },
  { href: '/learning', label: '学习' },
  { href: '/about', label: '关于' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : { left: 0, width: 0 });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    for (const item of Array.from(nav.children)) observer.observe(item);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setScrolled(scrollY > 80);

          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          setReadProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0);
          frame = 0;
        });
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const isPostPage = pathname.startsWith('/posts/');

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoAccent}>◆</span> RINのblog
          </Link>
          <nav ref={navRef} className={styles.nav} aria-label="主导航">
            {navItems.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.active : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
              );
            })}
            <span data-nav-indicator aria-hidden="true" className={styles.navIndicator}
              style={{ width: indicator.width, transform: `translateX(${indicator.left}px)`, opacity: indicator.width ? 1 : 0 }} />
          </nav>
          <ThemeToggle />
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
