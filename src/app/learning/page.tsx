import type { Metadata } from 'next';
import { getPostsByCategory } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import styles from '@/styles/Categories.module.css';

export const metadata: Metadata = {
  title: '学习',
  description: '整理和分享学习过程中的笔记与收获',
};

export default function LearningPage() {
  const posts = getPostsByCategory('学习');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>学习</h1>
        <p className={styles.subtitle}>Learning Notes · {posts.length} 篇文章</p>
        <div className={styles.divider} />
      </div>

      {posts.length > 0 ? (
        <div className={styles.grid}>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>这里还没有学习笔记。</p>
          <p>在 content/posts 中新增文章，并将 category 设置为“学习”即可。</p>
        </div>
      )}
    </div>
  );
}
