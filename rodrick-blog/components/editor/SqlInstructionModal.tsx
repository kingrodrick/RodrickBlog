'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SqlInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SqlInstructionModal({ isOpen, onClose }: SqlInstructionModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const sqlCode = `-- Chạy câu lệnh này trong Supabase Dashboard -> SQL Editor để mở quyền ghi dữ liệu
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;

-- Loại bỏ cột route_coordinates cũ và thêm cột map_embed_url chuẩn Google Maps Embed
ALTER TABLE timeline_events DROP COLUMN IF EXISTS route_coordinates;
ALTER TABLE timeline_events ADD COLUMN IF NOT EXISTS map_embed_url TEXT;`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Không thể sao chép tự động, vui lòng chọn và copy thủ công.');
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="min-h-full flex items-start justify-center py-6 sm:py-12">
        <div
          className="fixed inset-0 -z-10"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-white border border-[#E6E2DA] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 z-10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#B93829] font-bold">
                CẤU HÌNH DATABASE SUPABASE
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18]">
                Mở quyền thêm / sửa dữ liệu (RLS)
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#57544E] leading-relaxed">
            Mặc định Supabase bật <strong>Row-Level Security (RLS)</strong> nên chỉ cho phép đọc dữ liệu. Để lưu trực tiếp các chuyến đi và timeline từ màn hình này vào cơ sở dữ liệu Supabase, bạn chỉ cần chạy đoạn mã SQL dưới đây trong bảng điều khiển Supabase:
          </p>

          <div className="relative bg-[#1C1B18] text-stone-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-stone-800">
            <pre className="text-emerald-400 leading-relaxed">{sqlCode}</pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 right-3 bg-[#B93829] hover:bg-[#A02B1D] text-white text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>{copied ? '✓ Đã sao chép!' : '📋 Sao chép SQL'}</span>
            </button>
          </div>

          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EFECE4] text-xs font-mono text-[#78756E] space-y-1">
            <p className="font-bold text-[#1C1B18]">📌 Hướng dẫn thao tác:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Mở Supabase Dashboard dự án của bạn</li>
              <li>Chọn mục <strong>SQL Editor</strong> ở thanh menu bên trái</li>
              <li>Dán đoạn lệnh trên và bấm <strong>Run</strong></li>
            </ol>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1C1B18] hover:bg-[#33312B] text-white text-xs font-mono uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SqlInstructionModal;
