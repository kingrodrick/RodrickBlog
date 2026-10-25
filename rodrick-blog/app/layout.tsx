import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Suspense } from 'react';
import { Footer, FooterView } from '@/components/layout/Footer';
import { MotionRoot } from '@/components/layout/MotionRoot';
import { AuthProvider } from '@/components/auth/AuthContext';

// Một họ chữ cho cả trang: Archivo, có bộ ký tự tiếng Việt
const archivo = Archivo({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600'],
  variable: '--font-archivo',
  display: 'swap',
});

// Bật lớp xuất hiện trước lần vẽ đầu; tự gỡ nếu React không khởi động trong 3 giây
const motionBoot = `(function(){var d=document.documentElement;if(!window.matchMedia||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.setAttribute('data-motion','');setTimeout(function(){if(!window.__motionReady)d.removeAttribute('data-motion')},3000)})();`;

export const metadata: Metadata = {
  title: 'RODRICK BLOG',
  description: 'Nơi tôi lưu trữ những kỉ niệm vui vẻ của mình',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${archivo.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
      </head>
      <body className="bg-ground text-ink font-sans antialiased min-h-svh flex flex-col">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Suspense fallback={<FooterView nextTrip={null} />}>
            <Footer />
          </Suspense>
        </AuthProvider>
        <MotionRoot />
      </body>
    </html>
  );
}
