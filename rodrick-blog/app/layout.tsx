import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

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
      className="scroll-smooth"
      style={{ backgroundColor: '#FAF8F5' }}
    >
      <body className="font-sans bg-[#FAF8F5] text-[#1C1B18] antialiased selection:bg-[#B93829]/15 selection:text-[#B93829] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 bg-[#FAF8F5]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}