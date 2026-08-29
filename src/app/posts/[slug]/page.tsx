import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs } from '@/lib/posts';
import PostSidebar from '@/components/PostSidebar';
import CommentSection from '@/components/CommentSection';
import ScrollAnimProvider from '@/components/ScrollAnimProvider';
import styles from '@/styles/PostDetail.module.css';
import { renderMarkdown } from '@/lib/markdown';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug: slug.replace(/\.(md|mdx)$/, '') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '文章未找到' };
  return { title: post.title, description: post.description };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className={styles.pageLayout}>
      <PostSidebar content={post.content} />
      <article className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← 返回首页
        </Link>

        <div className={styles.header}>
          <div className={styles.meta}>
            <time className={styles.date}>{post.date}</time>
            <Link href={`/categories/${encodeURIComponent(post.category)}`} className={styles.category}>
              {post.category}
            </Link>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.divider} />
        </div>

        <ScrollAnimProvider selector="[data-anim-content] > *">
          <div
            className={styles.content}
            data-anim-content
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        </ScrollAnimProvider>

        <div className={styles.tags}>
          {post.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>

        <CommentSection />
      </article>
    </div>
  );
}
