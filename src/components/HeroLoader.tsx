import styles from '@/styles/HeroLoader.module.css';

export default function HeroLoader({ children }: { children: React.ReactNode }) {
  return <div className={styles.content}>{children}</div>;
}
