import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
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
      className={`${plusJakarta.variable} ${inter.variable} scroll-smooth`}
      style={{ backgroundColor: '#FAF8F5' }}
    >
      {/* Cập nhật màu chữ Neutral #1A1A1A và màu bôi đen Primary #B61C25 */}
      <body className="bg-[#FAF8F5] text-[#1A1A1A] font-sans antialiased selection:bg-[#B61C25]/15 selection:text-[#B61C25] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-[#FAF8F5]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}