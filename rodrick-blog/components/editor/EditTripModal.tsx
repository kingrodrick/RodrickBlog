'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trip } from '@/types/database.type';
import { ItineraryService } from '@/services/itinerary.service';
import { ImageUploadInput } from './ImageUploadInput';
import { slugifyFolderName } from '@/lib/cloudinary';

interface EditTripModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: (updatedTrip: Trip) => void;
  onTripDeleted?: (deletedTripId: number) => void;
  onOpenSqlModal?: () => void;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function EditTripModal({
  trip,
  isOpen,
  onClose,
  onTripUpdated,
  onTripDeleted,
  onOpenSqlModal,
}: EditTripModalProps) {
  const [mounted, setMounted] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [cities, setCities] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'PLANNING' | 'ONGOING' | 'COMPLETED'>('PLANNING');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill form when trip changes
  useEffect(() => {
    if (trip) {
      setTitle(trip.title || '');
      setSlug(trip.slug || '');
      setCities(trip.cities || '');
      setStartDate(trip.start_date || '');
      setEndDate(trip.end_date || '');
      setStatus((trip.status as any) || 'PLANNING');
      setSummary(trip.summary || '');
      setCoverImage(trip.cover_image || '');
      setErrorMessage(null);
    }
  }, [trip]);

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

  if (!isOpen || !mounted || !trip) return null;

  const handleGenerateSlug = () => {
    if (title) {
      setSlug(slugify(title));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên chuyến đi.');
      return;
    }
    if (!slug.trim()) {
      setErrorMessage('Vui lòng nhập đường dẫn slug.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedTrip = await ItineraryService.updateTrip(trip.id, {
        title: title.trim(),
        slug: slug.trim(),
        cities: cities.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
        summary: summary.trim() || null,
        cover_image: coverImage.trim() || null,
      });

      onTripUpdated(updatedTrip);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật chuyến đi:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setErrorMessage(
          'Supabase đang chặn quyền ghi dữ liệu (Row-Level Security). Vui lòng nhấn vào "Cấu hình SQL Supabase" để mở quyền.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        setErrorMessage('Đường dẫn Slug này đã được sử dụng bởi chuyến đi khác. Vui lòng chọn slug khác.');
      } else {
        setErrorMessage(err?.message || 'Không thể lưu thay đổi. Vui lòng kiểm tra lại kết nối mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ chuyến đi "${trip.title}" không? Thao tác này sẽ xóa toàn bộ mốc timeline và hình ảnh liên quan.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await ItineraryService.deleteTrip(trip.id);
      if (onTripDeleted) {
        onTripDeleted(trip.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi xóa chuyến đi:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setErrorMessage(
          'Supabase chặn quyền xóa dữ liệu (RLS). Vui lòng cấu hình lệnh SQL để mở quyền.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else {
        setErrorMessage(err?.message || 'Không thể xóa chuyến đi này.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card with Max Height & Internal Scroll */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] bg-white border border-[#E6E2DA] rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-[#F0ECE4] bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#B93829] font-bold bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                ✏️ CHỈNH SỬA CHUYẾN ĐI
              </span>
              <span className="font-mono text-xs text-[#8C8881]">
                ID #{trip.id}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] mt-1">
              {trip.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSqlModal && (
              <button
                type="button"
                onClick={onOpenSqlModal}
                className="hidden sm:flex text-xs font-mono text-[#B93829] hover:text-[#1C1B18] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all items-center gap-1.5 cursor-pointer"
              >
                <span>⚡ SQL Supabase</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-stone-200 text-stone-600 hover:text-black flex items-center justify-center shadow-xs border border-[#E6E2DA] cursor-pointer text-sm font-bold transition-all hover:scale-105"
              title="Đóng (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-6">
          <form id="edit-trip-form" onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-2 animate-in fade-in">
                <span className="text-sm">⚠️</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Trip Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                Tên chuyến du lịch <span className="text-[#B93829]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Hành Trình Mùa Đông Nhật Bản 2026"
                className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-sm font-serif font-bold text-[#1C1B18] outline-hidden shadow-xs transition-colors"
              />
            </div>

            {/* Slug & Cities (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                    Đường dẫn Slug URL <span className="text-[#B93829]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="text-[10px] font-mono text-[#B93829] hover:underline cursor-pointer"
                  >
                    Tạo lại từ tên
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#78756E]">
                    /trips/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="nhat-ban-2026"
                    className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl pl-16 pr-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                  Các địa điểm / Thành phố <span className="text-[#B93829]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cities}
                  onChange={(e) => setCities(e.target.value)}
                  placeholder="VD: Tokyo • Kyoto • Osaka"
                  className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                />
              </div>
            </div>

            {/* Date Range: Start Date & End Date (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                  Ngày bắt đầu chuyến đi <span className="text-[#B93829]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                  Ngày kết thúc <span className="text-[#B93829]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                />
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                Trạng thái chuyến đi
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'PLANNING', label: '📋 Đang Lên Kế Hoạch', desc: 'Chưa khởi hành' },
                  { key: 'ONGOING', label: '✈️ Đang Diễn Ra', desc: 'Đang trong hành trình' },
                  { key: 'COMPLETED', label: '✓ Đã Hoàn Thành', desc: 'Đã hoàn tất chuyến đi' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setStatus(st.key as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      status === st.key
                        ? 'border-[#B93829] bg-rose-50/60 ring-2 ring-[#B93829]/20 shadow-xs'
                        : 'border-[#E6E2DA] hover:border-stone-400 bg-white text-[#57544E]'
                    }`}
                  >
                    <p className="text-xs font-mono font-bold text-[#1C1B18]">{st.label}</p>
                    <p className="text-[10px] font-sans text-[#78756E] mt-0.5">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                Mô tả tóm tắt hành trình
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="VD: Hành trình độc hành mùa đông qua những con phố Tokyo hiện đại và các ngôi chùa cổ kính ở Kyoto..."
                className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl p-4 text-xs font-sans text-[#1C1B18] outline-hidden shadow-xs transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2 pt-2 border-t border-[#F0ECE4]">
              <ImageUploadInput
                label="Ảnh bìa đại diện chuyến đi (Banner)"
                value={coverImage}
                onChange={setCoverImage}
                helperText="Ảnh bìa sẽ hiển thị trên trang chủ và đầu trang chi tiết chuyến đi."
                aspectRatio="banner"
                folder={slug.trim() || trip?.slug || slugifyFolderName(title) || 'trips'}
              />
            </div>
          </form>
        </div>

        {/* Fixed Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8 sm:py-4 border-t border-[#F0ECE4] bg-[#FAF8F5] shrink-0">
          <button
            type="button"
            disabled={isDeleting || isSubmitting}
            onClick={handleDelete}
            className="text-xs font-mono text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer font-semibold disabled:opacity-50"
          >
            {isDeleting ? 'Đang xóa...' : '🗑️ Xóa chuyến đi này'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono text-[#78756E] hover:text-[#1C1B18] px-4 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-white transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              form="edit-trip-form"
              disabled={isSubmitting || isDeleting}
              className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-[#B93829]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span>✓ LƯU THAY ĐỔI</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EditTripModal;
