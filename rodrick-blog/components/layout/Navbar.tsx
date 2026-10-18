'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isTripPage = pathname.startsWith('/trips');
  const isHome = pathname === '/';
  const { user, isLoggedIn, logout, setIsLoginModalOpen } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close UserMenu on outside click or ESC key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

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

          {/* User Auth: Login Button or Avatar if logged in */}
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              title="Đăng nhập tài khoản quản trị"
              className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-3.5 py-2 rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>ĐĂNG NHẬP</span>
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="relative flex items-center focus:outline-hidden cursor-pointer group"
                title={`Tài khoản: ${user?.name}`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#B93829] shadow-xs group-hover:scale-105 transition-transform bg-[#F3F0EA]">
                  <img
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white border border-[#E6E2DA] rounded-2xl shadow-xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 border-b border-[#F0ECE4] pb-3">
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E6E2DA]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif text-sm font-bold text-[#1C1B18] truncate leading-tight">
                          {user?.name}
                        </h4>
                        <p className="font-mono text-[10px] text-[#78756E] truncate mt-0.5">
                          @{user?.username}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-[#57544E] space-y-1.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFECE4]">
                      <div className="flex items-center justify-between">
                        <span>Vai trò:</span>
                        <span className="font-semibold text-[#B93829]">Tác giả / Admin</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Quyền hạn:</span>
                        <span className="text-emerald-700 font-semibold">Chỉnh sửa kế hoạch</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          if (pathname.startsWith('/editor') || pathname.startsWith('/admin')) {
                            router.replace('/');
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono text-rose-700 bg-rose-50 hover:bg-rose-200 transition-colors flex items-center justify-center cursor-pointer font-semibold"
                      >
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal />
    </header>
  );
}

export default Navbar;
