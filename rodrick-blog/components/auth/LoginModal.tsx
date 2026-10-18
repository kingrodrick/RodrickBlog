'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthContext';

const REMEMBER_KEY = 'rodrick_remembered_credentials';

export function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill credentials if previously remembered, and handle body scroll lock
  useEffect(() => {
    if (isLoginModalOpen) {
      setError(null);
      document.body.style.overflow = 'hidden';

      try {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.username && parsed.password) {
            setUsername(parsed.username);
            setPassword(parsed.password);
            setRememberMe(true);
          }
        }
      } catch {
        // ignore
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoginModalOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isLoginModalOpen) {
        setIsLoginModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, setIsLoginModalOpen]);

  if (!isLoginModalOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Đăng nhập không thành công.');
      } else {
        // Handle remember me persistence
        if (rememberMe) {
          try {
            localStorage.setItem(
              REMEMBER_KEY,
              JSON.stringify({ username, password })
            );
          } catch {
            // ignore
          }
        } else {
          try {
            localStorage.removeItem(REMEMBER_KEY);
          } catch {
            // ignore
          }
        }
      }
    }, 250);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setIsLoginModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white border border-[#E6E2DA] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 m-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsLoginModalOpen(false)}
          aria-label="Đóng"
          className="absolute top-4 right-4 text-stone-400 hover:text-[#1C1B18] w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer text-sm font-mono"
        >
          ✕
        </button>

        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h4 className="font-serif text-2xl font-bold text-[#1C1B18]">
            Đăng Nhập
          </h4>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-[#B93829] p-3 rounded-xl text-xs flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#57544E]"
            >
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              required
              autoFocus={!username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              className="w-full bg-[#FAF8F5] border border-[#E6E2DA] focus:border-[#B93829] focus:ring-1 focus:ring-[#B93829] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1B18] font-mono outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#57544E]"
              >
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] font-mono text-[#8C8881] hover:text-[#1C1B18] cursor-pointer"
              >
                {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF8F5] border border-[#E6E2DA] focus:border-[#B93829] focus:ring-1 focus:ring-[#B93829] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1B18] font-mono outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Checkbox Ghi nhớ đăng nhập */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E6E2DA] accent-[#B93829] cursor-pointer"
              />
              <span className="text-xs font-mono text-[#57544E] hover:text-[#1C1B18] transition-colors">
                Ghi nhớ thông tin đăng nhập lần sau
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1C1B18] hover:bg-[#B93829] text-white font-mono text-xs uppercase tracking-wider py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>ĐĂNG NHẬP</span>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default LoginModal;
