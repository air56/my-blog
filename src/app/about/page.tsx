import type { Metadata } from 'next';
import styles from '@/styles/About.module.css';

export const metadata: Metadata = {
  title: '关于我',
  description: '关于我和这个博客',
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>关于我</h1>
        <p className={styles.subtitle}>About</p>
        <div className={styles.divider} />
      </div>

      <div className={styles.content}>
        <p>
          你好，欢迎来到我的个人博客。这里是一个记录思考、分享见闻的小角落。
        </p>
        <p>
          这个博客使用 Next.js 构建，设计灵感来自《明日方舟：终末地》官方网站的工业美学风格。
        </p>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>关于这个博客</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>记录个人随笔与思考</li>
            <li className={styles.listItem}>分享阅读与学习心得</li>
            <li className={styles.listItem}>探索技术与设计的边界</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>联系方式</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>GitHub: github.com</li>
            <li className={styles.listItem}>Email: hello@example.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
