import { getAllPosts, getAllCategories } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import styles from './page.module.css';

export default function HomePage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div
          className={styles.heroImage}
          style={{ backgroundImage: 'url("/my-blog/images/hero-bg.jpg")' }}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>✦ 随笔 · 记录 · 思考</div>
          <h1 className={styles.heroTitle}>
            用文字<br />记录生活与代码
          </h1>
          <p className={styles.heroSubtitle}>
            一个关于嵌入式开发、电子设计和个人随笔的博客。
            分享技术探索中的点滴收获与生活里的微小感动。
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatNum}>{posts.length}</div>
              <div className={styles.heroStatLabel}>文章</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatNum}>{categories.length}</div>
              <div className={styles.heroStatLabel}>分类</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatNum}>2025</div>
              <div className={styles.heroStatLabel}>始于</div>
            </div>
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <span>向下滚动</span>
          <div className={styles.scrollArrow} />
        </div>

        <div className={styles.heroBottomFade} />
      </section>

      {/* Posts */}
      <div className={styles.postsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>最新文章</h2>
            <p className={styles.sectionSubtitle}>记录技术、设计与生活</p>
          </div>
        </div>
        <div className={styles.sectionDivider} />

        {posts.length > 0 ? (
          <div className={styles.postGrid}>
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>◇</div>
            <p>还没有文章</p>
          </div>
        )}
      </div>
    </>
  );
}
