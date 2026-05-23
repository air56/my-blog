import { getAllPosts } from '@/lib/posts';
import PostCard from '@/components/PostCard';

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-2xl)' }}>
      <section style={{ marginBottom: 'var(--space-3xl)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            marginBottom: 'var(--space-sm)',
            letterSpacing: '0.02em',
          }}
        >
          随笔
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 'var(--space-lg)' }}>
          记录与思考
        </p>
        <div className="section-divider" />
      </section>

      {posts.length > 0 ? (
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
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-3xl) 0',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>◇</p>
          <p>还没有文章</p>
        </div>
      )}
    </div>
  );
}
