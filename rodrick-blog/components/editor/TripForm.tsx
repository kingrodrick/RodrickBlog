'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ItineraryService } from '@/services/itinerary.service';
import { ImageUploadInput } from './ImageUploadInput';
import { slugifyFolderName } from '@/lib/cloudinary';
import { Trip } from '@/types/database.type';

interface TripFormProps {
  onTripCreated?: (newTrip: Trip) => void;
  onOpenSqlModal?: () => void;
  modalMode?: boolean;
  hideHeader?: boolean;
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

export function TripForm({
  onTripCreated,
  onOpenSqlModal,
  modalMode = false,
  hideHeader = false,
}: TripFormProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [cities, setCities] = useState('Tokyo • Kyoto');
  const [startDate, setStartDate] = useState('2026-12-12');
  const [endDate, setEndDate] = useState('2026-12-18');
  const [status, setStatus] = useState<'PLANNING' | 'ONGOING' | 'COMPLETED'>('PLANNING');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTrip, setSuccessTrip] = useState<Trip | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto generate slug when title changes (if slug hasn't been manually heavily altered)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(val));
    }
  };

  const handleGenerateSlug = () => {
    if (title) {
      setSlug(slugify(title));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessTrip(null);

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
      const newTrip = await ItineraryService.createTrip({
        title: title.trim(),
        slug: slug.trim(),
        cities: cities.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
        summary: summary.trim() || null,
        cover_image: coverImage.trim() || null,
      });

      setSuccessTrip(newTrip);
      if (onTripCreated) {
        onTripCreated(newTrip);
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo chuyến đi:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setErrorMessage(
          'Supabase đang chặn quyền ghi dữ liệu (Row-Level Security). Vui lòng nhấn vào "Cấu hình SQL Supabase" ở góc trên để mở quyền trong 10 giây.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        setErrorMessage('Slug này đã tồn tại! Vui lòng chọn slug khác.');
      } else {
        setErrorMessage(err?.message || 'Không thể tạo chuyến đi. Vui lòng kiểm tra lại kết nối mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setSlug('');
    setCities('Tokyo • Kyoto');
    setStartDate('2026-12-12');
    setEndDate('2026-12-18');
    setStatus('PLANNING');
    setSummary('');
    setCoverImage('');
    setSuccessTrip(null);
    setErrorMessage(null);
  };

  return (
    <div className={`space-y-6 ${hideHeader ? '' : 'bg-white border border-[#E6E2DA] rounded-3xl p-6 sm:p-8 shadow-xs'}`}>
      {/* Form Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE4]">
          <div>
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#B93829] font-bold">
              BƯỚC 1 • TẠO CHUYẾN ĐI
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-1">
              Thêm Chuyến Du Lịch Mới
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#78756E] mt-1">
              Điền đầy đủ các thông tin tổng quan, lịch trình từ ngày đến ngày và ảnh bìa đại diện.
            </p>
          </div>

          {onOpenSqlModal && (
            <button
              type="button"
              onClick={onOpenSqlModal}
              className="self-start sm:self-auto text-xs font-mono text-[#B93829] hover:text-[#1C1B18] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡ Cấu hình SQL Supabase</span>
            </button>
          )}
        </div>
      )}

      {/* Success Notification */}
      {successTrip && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <h4 className="font-serif text-base font-bold">
              Tạo chuyến đi thành công: {successTrip.title}
            </h4>
          </div>
          <p className="text-xs font-sans text-emerald-800">
            Chuyến đi đã được lưu vào hệ thống! Bạn có thể xem trực tiếp giao diện ngoài trang web hoặc chuyển sang tab tiếp theo để thêm các mốc sự kiện timeline.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/trips/${successTrip.slug}`}
              target="_blank"
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <span>Xem trang chuyến đi vừa tạo</span>
              <span>↗</span>
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              + Tạo thêm chuyến khác
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-sans space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <span>⚠️ Thông báo lỗi:</span>
          </div>
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
            Tên chuyến du lịch <span className="text-[#B93829]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="VD: Hành Trình Mùa Đông Nhật Bản: Tokyo - Kyoto - Osaka"
            className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-3 text-sm font-sans text-[#1C1B18] outline-hidden shadow-xs transition-colors"
          />
        </div>

        {/* Slug & Cities (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                Đường dẫn slug (URL) <span className="text-[#B93829]">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="text-[10px] font-mono text-[#B93829] hover:underline cursor-pointer"
              >
                ↻ Tạo từ tên
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
                placeholder="nhat-ban-thang-12-2026"
                className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl pl-16 pr-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Địa điểm / Thành phố <span className="text-[#B93829]">*</span>
            </label>
            <input
              type="text"
              required
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              placeholder="VD: Tokyo • Kyoto hoặc Tokyo, Kyoto, Osaka"
              className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Dates & Status (3 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Từ ngày (Khởi hành) <span className="text-[#B93829]">*</span>
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
              Đến ngày (Kết thúc) <span className="text-[#B93829]">*</span>
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Trạng thái hành trình
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors cursor-pointer"
            >
              <option value="PLANNING">● Đang Lên Kế Hoạch</option>
              <option value="ONGOING">● Đang Diễn Ra</option>
              <option value="COMPLETED">● Đã Hoàn Thành</option>
            </select>
          </div>
        </div>

        {/* Summary Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
            Mô tả tóm tắt chuyến đi
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="VD: Hành trình khám phá trọn vẹn Tokyo và 3 ngày trải nghiệm chiều sâu văn hóa tại Kyoto qua ống kính Sony A6400..."
            className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl p-4 text-xs font-sans text-[#1C1B18] outline-hidden shadow-xs transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Background / Cover Image Upload */}
        <div className="pt-2">
          <ImageUploadInput
            label="Ảnh Background / Bìa Chuyến Đi (Cover Image)"
            value={coverImage}
            onChange={setCoverImage}
            helperText="Ảnh bìa sẽ được hiển thị ở đầu trang chi tiết và thẻ chuyến đi trên trang chủ."
            aspectRatio="banner"
            folder={slug.trim() || slugifyFolderName(title) || 'trips'}
          />
        </div>

        {/* Submit Action Buttons */}
        <div className="pt-4 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-[#78756E] hover:text-[#1C1B18] px-4 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            Làm lại form
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#B93829]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu chuyến đi...</span>
              </>
            ) : (
              <>
                <span>✓ LƯU & TẠO CHUYẾN ĐI</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TripForm;
