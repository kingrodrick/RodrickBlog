'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const isTripPage = pathname.startsWith('/trips');
  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6E2DA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Context */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex flex-col group">
            <div className="flex items-center gap-1">
              <span className="font-serif text-xl font-bold tracking-tight text-[#1C1B18] group-hover:text-[#B93829] transition-colors">
                RODRICK
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B93829]" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#78756E] -mt-1">
              Ký sự du lịch & nhiếp ảnh Sony A6400
            </span>
          </Link>

          {isTripPage && (
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-[#E6E2DA] text-[11px] font-mono text-[#B93829]">
              <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 font-semibold">
                📍 CHI TIẾT HÀNH TRÌNH
              </span>
            </div>
          )}
        </div>

        {/* Menu Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium uppercase tracking-wider">
          <Link
            href="/"
            className={`py-1 transition-colors ${
              isHome
                ? 'text-[#1C1B18] font-semibold border-b-2 border-[#B93829]'
                : 'text-[#57544E] hover:text-[#B93829]'
            }`}
          >
            Trang chủ
          </Link>
          <Link
            href="/#trips"
            className={`py-1 transition-colors ${
              isTripPage
                ? 'text-[#1C1B18] font-semibold border-b-2 border-[#B93829]'
                : 'text-[#57544E] hover:text-[#B93829]'
            }`}
          >
            Hành trình
          </Link>
          <Link
            href="/#gallery"
            className="text-[#57544E] hover:text-[#B93829] py-1 transition-colors"
          >
            Bộ sưu tập
          </Link>
          <Link
            href="/#footer"
            className="text-[#57544E] hover:text-[#B93829] py-1 transition-colors"
          >
            Về tôi
          </Link>
        </nav>

        {/* Actions Right */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/#gallery"
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#F2EFE9] border border-[#E2DDD5] rounded-full px-3 py-1.5 text-xs text-[#57544E] hover:border-[#1C1B18] transition-colors font-mono"
          >
            <span>📷</span>
            <span>SONY A6400</span>
          </Link>

          {isTripPage ? (
            <Link
              href="/#trips"
              className="bg-[#1C1B18] hover:bg-[#B93829] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors font-mono uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>←</span>
              <span>CÁC CHUYẾN ĐI</span>
            </Link>
          ) : (
            <Link
              href="/#trips"
              className="bg-[#1C1B18] hover:bg-[#33312B] text-white text-xs font-medium px-4 py-2 rounded-md transition-colors font-mono uppercase tracking-wider"
            >
              CÁC CHUYẾN ĐI
            </Link>
          )}

          <div className="w-8 h-8 rounded-full bg-[#B93829] text-white flex items-center justify-center text-xs font-bold font-serif shadow-xs">
            R
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
