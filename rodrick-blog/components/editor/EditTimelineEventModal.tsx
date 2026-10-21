'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TimelineEvent } from '@/types/database.type';
import { ItineraryService } from '@/services/itinerary.service';
import { TimelinePhotosManager, TimelineImageItem } from './TimelinePhotosManager';
import {
  parseTimeSlotRange,
  formatTimeSlotRange,
  calculateDayNumberFromDates,
} from '@/lib/timeUtils';
import { AdminRoutePickerMap } from '@/components/itinerary/AdminRoutePickerMap';

interface EditTimelineEventModalProps {
  event: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: (updatedEvent: TimelineEvent) => void;
  onEventDeleted?: (deletedEventId: number) => void;
  onOpenSqlModal?: () => void;
  existingDates?: string[];
  tripSlug?: string;
  tripTitle?: string;
}

export function EditTimelineEventModal({
  event,
  isOpen,
  onClose,
  onEventUpdated,
  onEventDeleted,
  onOpenSqlModal,
  existingDates,
  tripSlug,
  tripTitle,
}: EditTimelineEventModalProps) {
  const [mounted, setMounted] = useState(false);

  // Form states
  const [tripDate, setTripDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [isOvernight, setIsOvernight] = useState<boolean>(false);
  const [allTripDates, setAllTripDates] = useState<string[]>(existingDates || []);
  const [locationName, setLocationName] = useState<string>('');
  const [city, setCity] = useState<string>('Kyoto');
  const [categoryTag, setCategoryTag] = useState<string>('SIGHTSEEING');
  const [notes, setNotes] = useState<string>('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState<string>('');
  const [images, setImages] = useState<TimelineImageItem[]>([]);

  const [activeTab, setActiveTab] = useState<'info' | 'map' | 'photos'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validPhotoCount = useMemo(
    () => images.filter((img) => img.url.trim().length > 0).length,
    [images]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all trip dates if not passed via props
  useEffect(() => {
    if (existingDates && existingDates.length > 0) {
      setAllTripDates(existingDates);
    } else if (event?.trip_id) {
      ItineraryService.getTimelineWithImages(event.trip_id)
        .then((events) => {
          const dates = Array.from(new Set(events.map((e) => e.trip_date).filter(Boolean)));
          setAllTripDates(dates);
        })
        .catch(console.error);
    }
  }, [existingDates, event?.trip_id]);

  // Pre-fill form when event changes
  useEffect(() => {
    if (event) {
      setTripDate(event.trip_date || '');
      const parsed = parseTimeSlotRange(event.time_slot);
      setStartTime(parsed.startTime || '09:00');
      setEndTime(parsed.endTime || '11:00');
      setIsOvernight(parsed.isOvernight);
      setLocationName(event.location_name);
      setCity(event.city || 'Kyoto');
      setCategoryTag(event.category_tag || 'SIGHTSEEING');
      setNotes(event.notes || '');
      setMapEmbedUrl(event.map_embed_url || '');

      const initialImages: TimelineImageItem[] = (event.images || []).map((img, idx) => ({
        id: `img-${img.id || idx}`,
        url: img.cloudinary_url || '',
        caption: img.caption || '',
        isRealPhoto: img.is_real_photo !== false,
        cameraGear: img.camera_gear || 'Sony A6400 • 18-135mm',
        exifInfo: img.exif_info || '',
      }));

      setImages(
        initialImages.length > 0
          ? initialImages
          : [
              {
                id: `img-${Date.now()}`,
                url: '',
                caption: '',
                isRealPhoto: true,
                cameraGear: 'Sony A6400 • 18-135mm',
                exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
              },
            ]
      );
      setErrorMessage(null);
    }
  }, [event]);

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

  // Auto-calculated day number from tripDate and allTripDates
  const effectiveDates = useMemo(() => {
    const list = [...allTripDates];
    if (tripDate && !list.includes(tripDate)) {
      list.push(tripDate);
    }
    return list;
  }, [allTripDates, tripDate]);

  const calculatedDayNumber = useMemo(() => {
    return calculateDayNumberFromDates(tripDate, effectiveDates);
  }, [tripDate, effectiveDates]);

  // Check if date is changed to a new date that is earlier than the earliest existing trip date
  const earliestTripDate = useMemo(() => {
    return allTripDates.length > 0 ? [...allTripDates].sort()[0] : null;
  }, [allTripDates]);

  // Chỉ cảnh báo khi người dùng thực sự thay đổi ngày của sự kiện này sang một ngày mới
  // sớm hơn ngày đầu tiên hiện tại của toàn bộ chuyến đi
  const isEarlierThanSchedule = Boolean(
    earliestTripDate &&
    tripDate &&
    event?.trip_date &&
    tripDate !== event.trip_date &&
    tripDate < earliestTripDate &&
    !allTripDates.includes(tripDate)
  );

  // Live formatted preview for the time slot
  const timeSlotPreview = useMemo(() => {
    return formatTimeSlotRange(startTime, endTime, tripDate, isOvernight);
  }, [startTime, endTime, tripDate, isOvernight]);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val && endTime && val > endTime) {
      setIsOvernight(true);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (startTime && val && startTime > val) {
      setIsOvernight(true);
    }
  };

  if (!isOpen || !mounted || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!locationName.trim()) {
      setErrorMessage('Vui lòng nhập tên địa điểm hoặc hoạt động.');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      setErrorMessage('Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc.');
      return;
    }

    const finalTimeSlot = formatTimeSlotRange(startTime, endTime, tripDate, isOvernight);

    const validImages = images
      .filter((img) => img.url.trim())
      .map((img) => ({
        cloudinary_url: img.url.trim(),
        caption: img.caption.trim() || null,
        city,
        camera_gear: img.cameraGear.trim() || null,
        exif_info: img.exifInfo.trim() || null,
        is_real_photo: img.isRealPhoto,
        is_featured: false,
        taken_at: tripDate,
      }));

    try {
      setIsSubmitting(true);
      const updatedEvent = await ItineraryService.updateTimelineEvent(
        event.id,
        {
          day_number: calculatedDayNumber,
          trip_date: tripDate,
          time_slot: finalTimeSlot,
          location_name: locationName.trim(),
          city: city.trim(),
          category_tag: categoryTag,
          notes: notes.trim() || null,
          map_embed_url: mapEmbedUrl.trim() || null,
        },
        validImages
      );

      onEventUpdated(updatedEvent);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật sự kiện timeline:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setErrorMessage(
          'Supabase đang chặn quyền ghi dữ liệu (Row-Level Security). Vui lòng nhấn vào "Cấu hình SQL Supabase" để mở quyền.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else {
        setErrorMessage(err?.message || 'Không thể lưu thay đổi. Vui lòng kiểm tra lại kết nối.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa mốc sự kiện "${event.location_name}" khỏi timeline không?`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await ItineraryService.deleteTimelineEvent(event.id);
      if (onEventDeleted) {
        onEventDeleted(event.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi xóa sự kiện timeline:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setErrorMessage(
          'Supabase đang chặn quyền xóa dữ liệu (RLS). Vui lòng kiểm tra quyền trong Supabase.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else {
        setErrorMessage(err?.message || 'Không thể xóa sự kiện này.');
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
        className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-[#E6E2DA] rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-[#F0ECE4] bg-white shrink-0">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] truncate max-w-xl">
              Chỉnh Sửa: {event.location_name}
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

        {/* 🌟 PREMIUM UNDERLINE TAB NAVIGATION BAR */}
        <nav aria-label="Các mục biên tập" className="flex items-center gap-6 sm:gap-8 px-6 sm:px-8 border-b border-[#E6E2DA] bg-[#FAF8F5]/90 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`relative py-3.5 sm:py-4 text-xs sm:text-sm font-mono tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 group ${
              activeTab === 'info'
                ? 'text-[#B93829] font-bold'
                : 'text-[#78756E] hover:text-[#1C1B18] font-medium'
            }`}
          >
            <span className={`text-base transition-transform duration-200 ${activeTab === 'info' ? 'scale-110' : 'group-hover:scale-105'}`}>
              📝
            </span>
            <span>Thông tin chung</span>

            {/* Active Underline Indicator */}
            {activeTab === 'info' ? (
              <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#B93829] rounded-t-full shadow-2xs" />
            ) : (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-transparent group-hover:bg-[#E6E2DA] transition-colors rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`relative py-3.5 sm:py-4 text-xs sm:text-sm font-mono tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 group ${
              activeTab === 'map'
                ? 'text-[#B93829] font-bold'
                : 'text-[#78756E] hover:text-[#1C1B18] font-medium'
            }`}
          >
            <span className={`text-base transition-transform duration-200 ${activeTab === 'map' ? 'scale-110' : 'group-hover:scale-105'}`}>
              🗺️
            </span>
            <span>Bản đồ</span>
            {mapEmbedUrl && mapEmbedUrl.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Đã gắn link bản đồ" />
            )}

            {activeTab === 'map' ? (
              <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#B93829] rounded-t-full shadow-2xs" />
            ) : (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-transparent group-hover:bg-[#E6E2DA] transition-colors rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`relative py-3.5 sm:py-4 text-xs sm:text-sm font-mono tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 group ${
              activeTab === 'photos'
                ? 'text-[#B93829] font-bold'
                : 'text-[#78756E] hover:text-[#1C1B18] font-medium'
            }`}
          >
            <span className={`text-base transition-transform duration-200 ${activeTab === 'photos' ? 'scale-110' : 'group-hover:scale-105'}`}>
              📷
            </span>
            <span>Bộ sưu tập ảnh</span>
            {validPhotoCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                activeTab === 'photos'
                  ? 'bg-rose-100 text-[#B93829] font-bold border border-rose-200'
                  : 'bg-[#EFECE4] text-stone-600 group-hover:bg-stone-200'
              }`}>
                {validPhotoCount}
              </span>
            )}

            {activeTab === 'photos' ? (
              <span className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#B93829] rounded-t-full shadow-2xs" />
            ) : (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-transparent group-hover:bg-[#E6E2DA] transition-colors rounded-t-full" />
            )}
          </button>
        </nav>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-sans space-y-1 mb-6 animate-in fade-in duration-150">
              <span className="font-bold text-rose-800">⚠️ Lỗi:</span>
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TAB 1: THÔNG TIN CHUNG */}
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Real Date & Auto-calculated Day Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                      Ngày thực tế <span className="text-[#B93829]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={tripDate}
                      onChange={(e) => setTripDate(e.target.value)}
                      className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                      Thứ tự ngày
                    </label>
                    <div className="flex items-center gap-2 h-[41px] px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E2DA] text-xs font-mono font-bold text-[#1C1B18]">
                      <span className="w-2 h-2 rounded-full bg-[#B93829]" />
                      <span>Ngày {calculatedDayNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Smart Banner if this date is earlier than earliest trip date */}
                {isEarlierThanSchedule && earliestTripDate && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono flex items-center gap-2">
                    <span>💡</span>
                    <span>Ngày {tripDate} sẽ được tự động xếp làm <strong>Ngày 1</strong> của chuyến đi.</span>
                  </div>
                )}

                {/* Structured Time Slot Selector (Start Time -> End Time, Overnight Support) */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E2DA] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                      Khung giờ hoạt động <span className="text-[#B93829]">*</span>
                    </label>
                    {timeSlotPreview && (
                      <span className="text-[11px] font-mono font-bold text-[#B93829] bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-2xs">
                        ⏱️ {timeSlotPreview}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-[#78756E] block">Từ (Giờ bắt đầu)</span>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full bg-white focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-2 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-[#78756E] block">Đến (Giờ kết thúc)</span>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className="w-full bg-white focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-2 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-[#57534E] hover:text-[#1C1B18] select-none">
                      <input
                        type="checkbox"
                        checked={isOvernight}
                        onChange={(e) => setIsOvernight(e.target.checked)}
                        className="rounded text-[#B93829] focus:ring-[#B93829] border-stone-300 w-4 h-4 cursor-pointer"
                      />
                      <span>Chặng qua đêm (sang ngày hôm sau / +1 ngày)</span>
                    </label>

                    {isOvernight && (
                      <span className="text-[10px] font-mono text-[#B93829] bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                        🌙 Chuyển tiếp qua ngày kế tiếp
                      </span>
                    )}
                  </div>
                </div>

                {/* Location Name & City (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                      Tên địa điểm / Sự kiện <span className="text-[#B93829]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="VD: Chùa Kinkaku-ji (Gác Vàng)..."
                      className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-sm font-sans text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                      Thành phố <span className="text-[#B93829]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="VD: Kyoto, Tokyo, Osaka..."
                      className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
                    />
                  </div>
                </div>

                {/* Category Tag Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                    Phân loại hoạt động (Category)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { key: 'SIGHTSEEING', label: '⛩️ Tham Quan' },
                      { key: 'FOOD', label: '🍜 Ẩm Thực' },
                      { key: 'TRANSIT', label: '🚄 Di Chuyển' },
                      { key: 'HOTEL', label: '🏨 Khách Sạn' },
                      { key: 'PHOTOGRAPHY', label: '📷 Chụp Ảnh' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCategoryTag(cat.key)}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer text-center ${
                          categoryTag === cat.key
                            ? 'border-[#B93829] bg-rose-50 text-[#B93829] font-bold shadow-xs'
                            : 'border-[#E6E2DA] hover:border-stone-400 bg-white text-[#57544E]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes & Tips */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                    Ghi chú chi tiết, góc chụp & kinh nghiệm thực tế
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Nên đến trước 9h sáng..."
                    className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl p-4 text-xs font-sans text-[#1C1B18] outline-hidden shadow-xs transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BẢN ĐỒ */}
            {activeTab === 'map' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Link Bản đồ Google Maps Embed (Tùy chọn) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
                      📍 Link Bản đồ Google Maps
                    </label>
                    <span className="font-mono text-[11px] text-[#78756E]">Tùy chọn</span>
                  </div>
                  <input
                    type="text"
                    value={mapEmbedUrl}
                    onChange={(e) => setMapEmbedUrl(e.target.value)}
                    placeholder="Dán link Google Maps hoặc mã <iframe>"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] text-xs text-[#1C1B18] font-mono focus:bg-white focus:outline-none focus:border-[#B61C25] transition-all"
                  />
                </div>

                {/* Trình tạo & Xem trước Bản đồ Google Maps Embed */}
                <div>
                  <AdminRoutePickerMap
                    initialCity={city}
                    locationName={locationName}
                    mapEmbedUrl={mapEmbedUrl}
                    onMapEmbedUrlChange={setMapEmbedUrl}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: BỘ SƯU TẬP ẢNH */}
            {activeTab === 'photos' && (
              <div className="animate-in fade-in duration-150">
                <TimelinePhotosManager
                  images={images}
                  onChange={setImages}
                  city={city}
                  tripSlug={tripSlug}
                  tripTitle={tripTitle}
                  tripDate={tripDate}
                />
              </div>
            )}

            {/* Bottom Actions - Luôn cố định bên dưới để lưu bất cứ lúc nào */}
            <div className="pt-4 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                disabled={isDeleting || isSubmitting}
                onClick={handleDelete}
                className="text-xs font-mono text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer font-semibold disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : '🗑️ Xóa sự kiện này'}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-mono text-[#78756E] hover:text-[#1C1B18] px-4 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-[#B93829]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu thay đổi...</span>
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
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default EditTimelineEventModal;
