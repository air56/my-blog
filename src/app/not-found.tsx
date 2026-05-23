import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <style>{`
        .not-found-btn {
          display: inline-block;
          padding: 0.75rem 2rem;
          border: 1px solid var(--accent-yellow);
          color: var(--accent-yellow);
          font-size: 0.875rem;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
        }
        .not-found-btn:hover {
          background: var(--accent-yellow) !important;
          color: #000 !important;
        }
      `}</style>
      <div
        style={{
          fontSize: '5rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--accent-yellow)',
          lineHeight: 1,
          marginBottom: '1rem',
        }}
      >
        404
      </div>
      <div
        className="section-divider"
        style={{ maxWidth: '200px', margin: '0 auto 1.5rem' }}
      />
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
        页面未找到
      </p>
      <Link href="/" className="not-found-btn">
        返回首页
      </Link>
    </div>
  );
}
