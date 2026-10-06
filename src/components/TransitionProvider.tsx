'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import styles from '@/styles/TransitionProvider.module.css';

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Animate only the page: the fixed header and footer retain their own layout.
    const content = shellRef.current?.querySelector<HTMLElement>(':scope > main');
    if (!content || typeof content.animate !== 'function') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: Animation | undefined;
    const cancelAnimation = () => {
      animation?.cancel();
      animation = undefined;
    };

    if (!reducedMotion.matches) {
      animation = content.animate([
        { opacity: 0, transform: 'translateY(12px)', filter: 'blur(3px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ], {
        duration: 420,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    }

    const onClick = (event: MouseEvent) => {
      if (reducedMotion.matches || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') ||
          (link.target && link.target.toLowerCase() !== '_self')) return;

      let destination: URL;
      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      const currentPath = window.location.pathname.replace(/\/$/, '');
      if (destination.origin !== window.location.origin ||
          destination.pathname.replace(/\/$/, '') === currentPath) return;

      cancelAnimation();
      // This short pulse never delays routing or leaves a failed navigation hidden.
      // No fill mode means the underlying readable styles always return on completion.
      animation = content.animate([
        { opacity: 1, transform: 'none', offset: 0 },
        { opacity: 0.86, transform: 'translateY(-4px)', offset: 0.65 },
        { opacity: 1, transform: 'none', offset: 1 },
      ], { duration: 180, easing: 'ease-out' });
    };

    const onMotionPreference = () => {
      if (reducedMotion.matches) cancelAnimation();
    };
    document.addEventListener('click', onClick, true);
    reducedMotion.addEventListener('change', onMotionPreference);

    return () => {
      cancelAnimation();
      document.removeEventListener('click', onClick, true);
      reducedMotion.removeEventListener('change', onMotionPreference);
    };
  }, [pathname]);

  return (
    <div ref={shellRef} className={styles.shell}>
      {children}
    </div>
  );
}
