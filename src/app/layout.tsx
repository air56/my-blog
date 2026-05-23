import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransitionProvider from '@/components/TransitionProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'My Blog',
    template: '%s | My Blog',
  },
  description: '个人随笔博客',
  icons: {
    icon: '/my-blog/favicon.ico',
    apple: '/my-blog/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <TransitionProvider>
          <Header />
          <main style={{ minHeight: 'calc(100vh - var(--header-height))', paddingTop: 'var(--header-height)' }}>
            {children}
          </main>
          <Footer />
        </TransitionProvider>
      </body>
    </html>
  );
}
