import Link from 'next/link';
import { getAllCategories } from '@/lib/posts';
import type { Metadata } from 'next';
import styles from '@/styles/Categories.module.css';

export const metadata: Metadata = {
  title: '分类',
  description: '文章分类',
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>分类</h1>
        <p className={styles.subtitle}>Categories</p>
        <div className={styles.divider} />
      </div>

      {categories.length > 0 ? (
        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/categories/${encodeURIComponent(cat.name)}`}
              className={styles.categoryCard}
            >
              <div className={styles.categoryName}>{cat.name}</div>
              <div className={styles.categoryCount}>{cat.count} 篇文章</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>暂无分类</p>
        </div>
      )}
    </div>
  );
}
