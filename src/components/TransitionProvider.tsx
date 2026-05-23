'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
