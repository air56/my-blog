import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs } from '@/lib/posts';
import PostSidebar from '@/components/PostSidebar';
import styles from '@/styles/PostDetail.module.css';
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

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, (_, title: string) => {
              const id = title
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w一-鿿-]/g, '');
              return `<h2 id="${id}">${title}</h2>`;
            })
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/---/g, '<hr>')
            .replace(/\n\n(?!<[hupbld])/g, '</p><p>')
            .replace(/^(?!<[hupbld\/])/gm, '<p>')
            .replace(/<p>\s*<\/p>/g, '')
          }}
        />

        <div className={styles.tags}>
          {post.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
