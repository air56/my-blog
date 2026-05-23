import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCategories, getPostsByCategory } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import type { Metadata } from 'next';
import styles from '@/styles/Categories.module.css';

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((cat) => ({ tag: cat.name }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `${tag} - 分类`, description: `${tag} 分类下的文章` };
}

export default async function CategoryPage({ params }: Props) {
  const { tag } = await params;
  const posts = getPostsByCategory(tag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <Link href="/categories" className={styles.backLink}>
        ← 所有分类
      </Link>

      <div className={styles.header}>
        <h1 className={styles.title}>{tag}</h1>
        <p className={styles.subtitle}>{posts.length} 篇文章</p>
        <div className={styles.divider} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
