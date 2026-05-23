import Link from 'next/link';
import type { Post } from '@/lib/posts';
import styles from '@/styles/PostCard.module.css';

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className={styles.card}>
      <div className={styles.meta}>
        <time className={styles.date}>{post.date}</time>
        <span className={styles.category}>{post.category}</span>
      </div>
      <h2 className={styles.title}>{post.title}</h2>
      {post.description && <p className={styles.description}>{post.description}</p>}
    </Link>
  );
}
