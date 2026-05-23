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
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          border: '1px solid var(--accent-yellow)',
          color: 'var(--accent-yellow)',
          fontSize: '0.875rem',
          letterSpacing: '0.05em',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-yellow)';
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--accent-yellow)';
        }}
      >
        返回首页
      </Link>
    </div>
  );
}
