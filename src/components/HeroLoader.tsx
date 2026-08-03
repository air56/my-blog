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
