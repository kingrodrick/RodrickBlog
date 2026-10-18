import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer id="footer" className="border-t border-[#E5E0D8] bg-[#F5F2EC] mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-1">
            <span className="font-serif text-lg font-bold">RODRICK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B93829]" />
          </div>
          <p className="font-serif italic text-base text-[#33312B]">
            “Đi để mở rộng thế giới quan, chụp để lưu giữ nhịp thở của từng góc phố.”
          </p>
          <p className="text-xs text-[#78756E] max-w-sm leading-relaxed">
            Nhật ký hành trình độc hành và kho lưu trữ hình ảnh thực tế ghi lại từ máy ảnh Sony A6400 trong chuyến đi Nhật Bản (Tokyo & Kyoto).
          </p>
        </div>

        <div className="md:col-span-3 space-y-2.5 text-xs">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#8C8881]">
            CHUYÊN MỤC TRỌNG TÂM
          </h4>
          <ul className="space-y-2 text-[#4A4742]">
            <li>
              <Link href="/#trips" className="hover:text-[#B93829] transition-colors">
                Lịch Trình Chi Tiết (6 Ngày 7 Đêm)
              </Link>
            </li>
            <li>
              <Link href="/#gallery" className="hover:text-[#B93829] transition-colors">
                Bộ Sưu Tập Nhiếp Ảnh (Gallery)
              </Link>
            </li>
            <li>
              <span className="text-[#8C8881]">
                Thiết Bị: Sony A6400 (18-135mm)
              </span>
            </li>
            <li>
              <span className="text-[#8C8881]">
                Điểm Đến: Tokyo & Kyoto
              </span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-3 text-xs">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#8C8881]">
            KÊNH KẾT NỐI
          </h4>
          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            <a
              href="https://github.com/kingrodrick"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white border border-[#E2DDD5] rounded hover:border-[#1C1B18] transition-colors"
            >
              🐙 GITHUB
            </a>
            <a
              href="#"
              className="px-3 py-1 bg-white border border-[#E2DDD5] rounded hover:border-[#1C1B18] transition-colors"
            >
              📸 INSTAGRAM
            </a>
            <a
              href="#"
              className="px-3 py-1 bg-white border border-[#E2DDD5] rounded hover:border-[#1C1B18] transition-colors"
            >
              🌐 UNSPLASH
            </a>
          </div>
          <div className="inline-block font-mono text-[10px] px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            ● TRẠNG THÁI: CHUẨN BỊ LÊN ĐƯỜNG THÁNG 12/2026
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#8C8881]">
        <span>© 2026 Rodrick. Crafted with Next.js & Supabase.</span>
        <span>HÀ NỘI • SÀI GÒN • TOKYO • KYOTO</span>
      </div>
    </footer>
  );
}

export default Footer;
