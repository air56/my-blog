'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/Header.module.css';

type Theme = 'dark' | 'light';
type ThemeTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const desiredTheme = useRef<Theme>('dark');
  const activeTransition = useRef<ThemeTransition | null>(null);
  const revision = useRef(0);

  useEffect(() => {
    desiredTheme.current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(desiredTheme.current);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => {
      if (media.matches) activeTransition.current?.skipTransition();
    };
    media.addEventListener('change', stopMotion);
    return () => {
      revision.current += 1;
      activeTransition.current?.skipTransition();
      delete document.documentElement.dataset.themeTransition;
      media.removeEventListener('change', stopMotion);
    };
  }, []);

  const toggle = (button: HTMLButtonElement) => {
    const root = document.documentElement;
    const next: Theme = desiredTheme.current === 'dark' ? 'light' : 'dark';
    desiredTheme.current = next;
    const currentRevision = ++revision.current;
    const apply = () => {
      if (currentRevision !== revision.current) return;
      root.dataset.theme = next;
      setTheme(next);
      try { localStorage.setItem('rin-theme', next); } catch { /* Storage may be disabled. */ }
    };
    const startViewTransition = (document as Document & {
      startViewTransition?: (update: () => void) => ThemeTransition;
    }).startViewTransition;
    const wasRunning = Boolean(activeTransition.current);
    activeTransition.current?.skipTransition();
    activeTransition.current = null;
    delete root.dataset.themeTransition;

    if (wasRunning || !startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }

    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.style.setProperty('--theme-radius', `${radius}px`);
    root.dataset.themeTransition = 'reveal';

    try {
      const transition = startViewTransition.call(document, apply);
      activeTransition.current = transition;
      // A hidden tab or an overlapping navigation may skip the visual transition.
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {}).finally(() => {
        if (revision.current !== currentRevision) return;
        apply();
        activeTransition.current = null;
        delete root.dataset.themeTransition;
      });
    } catch {
      delete root.dataset.themeTransition;
      apply();
    }
  };

  return (
    <button
      type="button"
      className={styles.themeToggle}
      data-theme-toggle
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      onClick={(event) => toggle(event.currentTarget)}
    >
      <svg className={styles.themeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></> : <path d="M20.8 13.2A9 9 0 0 1 10.8 3.2a9 9 0 1 0 10 10Z" />}
      </svg>
    </button>
  );
}
