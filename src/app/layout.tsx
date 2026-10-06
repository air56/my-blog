import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransitionProvider from '@/components/TransitionProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RINのblog',
    template: '%s | RINのblog',
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('rin-theme')==='light'?'light':'dark'}catch{}` }} />
      </head>
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
