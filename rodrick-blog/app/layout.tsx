import type { Metadata } from 'next';
import { Inter, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const sans = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

const serif = Newsreader({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RODRICK • Ký Sự Du Lịch, Kiến Trúc Code & Tạp Bút',
  description: 'Một khu vườn số lưu giữ những chặng hành trình xê dịch, những dòng code kiến tạo sản phẩm và những tản văn chiêm nghiệm.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${serif.variable} ${mono.variable} scroll-smooth`}
      style={{ backgroundColor: '#FAF8F5' }}
    >
      <body className="bg-[#FAF8F5] text-[#1C1B18] font-sans antialiased selection:bg-[#B93829]/15 selection:text-[#B93829] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-[#FAF8F5]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}