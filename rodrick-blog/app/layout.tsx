import type { Metadata } from 'next';
import { Noto_Serif, Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const notoSerif = Noto_Serif({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-noto-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-space-grotesk',
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
      className={`${manrope.variable} ${notoSerif.variable} ${spaceGrotesk.variable} scroll-smooth`}
      style={{ backgroundColor: '#FAF8F5' }}
    >
      {/* Cập nhật màu text Neutral #1A1A1A và màu selection Primary #D9383A */}
      <body className="bg-[#FAF8F5] text-[#1A1A1A] font-sans antialiased selection:bg-[#D9383A]/15 selection:text-[#D9383A] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-[#FAF8F5]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}