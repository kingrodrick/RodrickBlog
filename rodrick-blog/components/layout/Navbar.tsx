'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/trips', label: 'Hành trình' },
  { href: '/#gallery', label: 'Bộ sưu tập' },
  // Tạm ẩn cùng phần "Về tôi" ở footer (SHOW_ABOUT trong Footer.tsx)
  // { href: '/#footer', label: 'Về tôi' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isTripPage = pathname.startsWith('/trips');
  const isHome = pathname === '/';
  const { user, isLoggedIn, logout, setIsLoginModalOpen } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Đóng menu tài khoản khi bấm ra ngoài hoặc nhấn ESC
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
        setIsMobileOpen(false);
      }
    }

    if (isUserMenuOpen || isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen, isMobileOpen]);

  const isActive = (href: string) =>
    (href === '/' && isHome) || (href === '/trips' && isTripPage);

  return (
    <header className="sticky top-0 z-40 bg-pattern">
      <div className="frame h-16 flex items-center justify-between gap-6">
        {/* Logo: tên in hoa kèm chấm đỏ, dòng phụ nhỏ bên dưới */}
        <Link href="/" className="group flex flex-col leading-none">
          <span className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight transition-colors duration-200 group-hover:text-accent">
              RODRICK
            </span>
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent" />
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-widest text-muted">
            Blog xàm xí của Rodrick
          </span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-8 text-small">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`py-2 transition-colors duration-200 hover:text-accent ${
                isActive(link.href) ? 'text-accent font-semibold' : 'text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="btn btn-ink min-h-10 py-2"
            >
              Đăng nhập
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 cursor-pointer text-small transition-colors duration-200 hover:text-accent"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <img
                  src={user?.avatar}
                  alt=""
                  className="w-8 h-8 object-cover bg-surface"
                />
                <span className="hidden sm:inline font-semibold">{user?.name}</span>
              </button>

              {isUserMenuOpen && (
                <div className="menu-float absolute right-0 mt-3 w-72 bg-paper p-5 z-50 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-11 h-11 object-cover bg-surface"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate leading-tight">{user?.name}</p>
                      <p className="text-small text-muted truncate">@{user?.username}</p>
                    </div>
                  </div>

                  <dl className="text-small bg-ground p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Vai trò</dt>
                      <dd className="font-semibold">Tác giả, admin</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Quyền hạn</dt>
                      <dd className="font-semibold">Chỉnh sửa kế hoạch</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                      if (pathname.startsWith('/editor') || pathname.startsWith('/admin')) {
                        router.replace('/');
                      }
                    }}
                    className="btn w-full"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-nav"
            className="md:hidden min-h-10 px-3 text-small font-semibold bg-surface cursor-pointer transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            {isMobileOpen ? 'Đóng' : 'Menu'}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Điều hướng chính"
          className="md:hidden frame pb-8 pt-2 bg-pattern"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`block py-2 text-head leading-none transition-colors duration-200 hover:text-accent ${
                    isActive(link.href) ? 'text-accent' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <LoginModal />
    </header>
  );
}

export default Navbar;
