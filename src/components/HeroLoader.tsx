'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/HeroLoader.module.css';

// 与 .overlay 的 transition: opacity 0.35s ease 保持一致
const FADE_MS = 350;

export default function HeroLoader({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'loading' | 'fading' | 'done'>('loading');
  const startedRef = useRef(false);

  // 挂载后才显示覆盖层：无 JS / 爬虫时保持服务端直出，不被黑层遮挡
  useEffect(() => {
    setMounted(true);
    if (startedRef.current) return;
    startedRef.current = true;

    const img = new Image();
    img.src = '/my-blog/images/hero-bg.jpg';
    img.onload = () => setStatus('fading');
    img.onerror = () => setStatus('fading'); // 失败也放行，黑底降级
  }, []);

  // fading 中间态：先淡出（0.35s transition 真实生效），再卸载覆盖层
  useEffect(() => {
    if (status !== 'fading') return;
    const t = setTimeout(() => setStatus('done'), FADE_MS);
    return () => clearTimeout(t);
  }, [status]);

  const showOverlay = mounted && (status === 'loading' || status === 'fading');

  return (
    <>
      {showOverlay && (
        <div
          aria-hidden="true"
          className={`${styles.overlay} ${status === 'fading' ? styles.fadeOut : ''}`}
        >
          <div className={styles.barTrack}>
            <div className={styles.bar} />
          </div>
        </div>
      )}
      <div className={mounted && status === 'loading' ? styles.hidden : styles.visible}>
        {children}
      </div>
    </>
  );
}
