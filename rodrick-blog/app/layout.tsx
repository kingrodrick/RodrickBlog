import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  // 🌟 Đã tăng cường thêm các mức weight dày hơn cho Headline
  weight: ['500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  // 🌟 Đẩy trọng số Body từ 300/400 lên các mức đậm đà hơn (400, 500, 600, 700)
  weight: ['400', '500', '600', '700'],
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
      <body className="bg-[#FAF8F5] text-[#1A1A1A] font-sans font-medium antialiased selection:bg-[#B61C25]/15 selection:text-[#B61C25] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-[#FAF8F5]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}