'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ItineraryService } from '@/services/itinerary.service';
import { ImageUploadInput } from './ImageUploadInput';
import { Trip, TimelineEvent } from '@/types/database.type';

interface TimelineEventFormProps {
  initialTripId?: number;
  onEventCreated?: (newEvent: TimelineEvent) => void;
  onOpenSqlModal?: () => void;
  hideHeader?: boolean;
  hideTripSelector?: boolean;
}

interface ImageInputItem {
  id: string;
  url: string;
  caption: string;
  isRealPhoto: boolean;
  cameraGear: string;
  exifInfo: string;
}

export function TimelineEventForm({
  initialTripId,
  onEventCreated,
  onOpenSqlModal,
  hideHeader = false,
  hideTripSelector = !!initialTripId,
}: TimelineEventFormProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  // Form states
  const [selectedTripId, setSelectedTripId] = useState<number | ''>(initialTripId || '');
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [tripDate, setTripDate] = useState<string>('2026-12-12');
  const [timeSlot, setTimeSlot] = useState<string>('08:30 - 10:30');
  const [locationName, setLocationName] = useState<string>('');
  const [city, setCity] = useState<string>('Kyoto');
  const [categoryTag, setCategoryTag] = useState<string>('SIGHTSEEING');
  const [notes, setNotes] = useState<string>('');

  // Images attached to this timeline event
  const [images, setImages] = useState<ImageInputItem[]>([
    {
      id: 'img-1',
      url: '',
      caption: '',
      isRealPhoto: true,
      cameraGear: 'Sony A6400 • 18-135mm',
      exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEvent, setSuccessEvent] = useState<TimelineEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load available trips
  useEffect(() => {
    async function loadTrips() {
      try {
        setIsLoadingTrips(true);
        const data = await ItineraryService.getAllTrips();
        setTrips(data);
        if (!selectedTripId && data.length > 0) {
          setSelectedTripId(initialTripId || data[0].id);
        }
      } catch (err) {
        console.error('Không thể tải danh sách chuyến đi:', err);
      } finally {
        setIsLoadingTrips(false);
      }
    }
    loadTrips();
  }, [initialTripId]);

  // Image helpers
  const addImageField = () => {
    setImages((prev) => [
      ...prev,
      {
        id: `img-${Date.now()}`,
        url: '',
        caption: '',
        isRealPhoto: true,
        cameraGear: 'Sony A6400 • 18-135mm',
        exifInfo: '50mm • f/4.0 • 1/200s • ISO 100',
      },
    ]);
  };

  const removeImageField = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateImageField = (id: string, updates: Partial<ImageInputItem>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessEvent(null);

    const effectiveTripId = Number(selectedTripId || initialTripId);

    if (!effectiveTripId) {
      setErrorMessage('Vui lòng chọn chuyến đi để gán sự kiện.');
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage('Vui lòng nhập tên địa điểm hoặc hoạt động.');
      return;
    }
    if (!timeSlot.trim()) {
      setErrorMessage('Vui lòng nhập khung giờ diễn ra.');
      return;
    }

    // Filter valid images that have a URL
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
      const newEvent = await ItineraryService.createTimelineEvent(
        {
          trip_id: effectiveTripId,
          day_number: Number(dayNumber),
          trip_date: tripDate,
          time_slot: timeSlot.trim(),
          location_name: locationName.trim(),
          city: city.trim(),
          category_tag: categoryTag,
          notes: notes.trim() || null,
        },
        validImages
      );

      setSuccessEvent(newEvent);
      if (onEventCreated) {
        onEventCreated(newEvent);
      }
    } catch (err: any) {
      console.error('Lỗi khi thêm sự kiện timeline:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setErrorMessage(
          'Supabase đang chặn quyền ghi dữ liệu (Row-Level Security). Vui lòng nhấn vào "Cấu hình SQL Supabase" ở góc trên để mở quyền trong 10 giây.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else {
        setErrorMessage(err?.message || 'Không thể tạo sự kiện timeline. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setLocationName('');
    setNotes('');
    setImages([
      {
        id: `img-${Date.now()}`,
        url: '',
        caption: '',
        isRealPhoto: true,
        cameraGear: 'Sony A6400 • 18-135mm',
        exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
      },
    ]);
    setSuccessEvent(null);
    setErrorMessage(null);
  };

  const selectedTrip = trips.find((t) => t.id === Number(selectedTripId));

  return (
    <div className={`space-y-6 ${hideHeader ? '' : 'bg-white border border-[#E6E2DA] rounded-3xl p-6 sm:p-8 shadow-xs'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE4]">
          <div>
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#B93829] font-bold">
              BƯỚC 2 • THÊM LỊCH TRÌNH
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-1">
              Thêm Sự Kiện Vào Timeline
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#78756E] mt-1">
              Gắn mốc thời gian, địa điểm, ghi chú chi tiết và các bức ảnh chụp thực tế từ Sony A6400.
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
      {successEvent && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <h4 className="font-serif text-base font-bold">
              Đã thêm mốc sự kiện: {successEvent.location_name} (Ngày {successEvent.day_number})
            </h4>
          </div>
          <p className="text-xs font-sans text-emerald-800">
            Sự kiện đã được gắn trực tiếp vào lịch trình của chuyến đi!
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {selectedTrip && (
              <Link
                href={`/trips/${selectedTrip.slug}`}
                target="_blank"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>Xem lịch trình chi tiết chuyến đi</span>
                <span>↗</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleResetForNext}
              className="bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              + Tiếp tục thêm sự kiện khác
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Choose Trip (Hidden if already preselected) */}
        {!hideTripSelector && (
          <div className="space-y-1.5 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E6E2DA]">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Chọn chuyến du lịch cần gắn sự kiện <span className="text-[#B93829]">*</span>
            </label>
            {isLoadingTrips ? (
              <p className="text-xs font-mono text-[#78756E] py-2">Đang tải danh sách chuyến đi...</p>
            ) : trips.length === 0 ? (
              <p className="text-xs font-mono text-rose-700 py-2">
                Chưa có chuyến đi nào trong database. Vui lòng qua Tab &quot;Thêm Chuyến Du Lịch&quot; để tạo trước!
              </p>
            ) : (
              <select
                required
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(Number(e.target.value))}
                className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-3 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors cursor-pointer"
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title} ({trip.cities} • {trip.start_date} đến {trip.end_date})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Day Number, Date, Time Slot (3 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Ngày thứ mấy trong chuyến <span className="text-[#B93829]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#78756E]">
                Ngày
              </span>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={dayNumber}
                onChange={(e) => setDayNumber(Number(e.target.value))}
                className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl pl-16 pr-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Ngày thực tế <span className="text-[#B93829]">*</span>
            </label>
            <input
              type="date"
              required
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
              Khung giờ <span className="text-[#B93829]">*</span>
            </label>
            <input
              type="text"
              required
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              placeholder="VD: 08:30 - 10:30 hoặc 14:00"
              className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs transition-colors"
            />
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
              placeholder="VD: Chùa Kinkaku-ji (Gác Vàng), Ga Tokyo, Phố Cổ Gion..."
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

        {/* Notes & Personal Tips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider font-semibold text-[#1C1B18]">
            Ghi chú chi tiết, góc chụp & kinh nghiệm thực tế
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Nên đến trước 9h sáng để tránh đông khách du lịch. Góc chụp đẹp nhất ở hồ nước phản chiếu ánh vàng..."
            className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl p-4 text-xs font-sans text-[#1C1B18] outline-hidden shadow-xs transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Attach Photos to Event */}
        <div className="space-y-4 pt-4 border-t border-[#F0ECE4]">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif text-base font-bold text-[#1C1B18]">
                Ảnh đính kèm mốc sự kiện (Sony A6400 & Tham khảo)
              </h4>
              <p className="font-mono text-[11px] text-[#78756E]">
                Thêm một hoặc nhiều bức ảnh sẽ hiển thị trong thẻ sự kiện này.
              </p>
            </div>
            <button
              type="button"
              onClick={addImageField}
              className="bg-white hover:bg-stone-50 border border-[#E6E2DA] text-[#1C1B18] hover:text-[#B93829] text-xs font-mono font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>+ Thêm ảnh khác</span>
            </button>
          </div>

          <div className="space-y-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E2DA] space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#1C1B18]">
                    Ảnh #{index + 1}
                  </span>
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(img.id)}
                      className="text-xs font-mono text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      ✕ Bỏ ảnh này
                    </button>
                  )}
                </div>

                <ImageUploadInput
                  label="URL hoặc file ảnh"
                  value={img.url}
                  onChange={(url) => updateImageField(img.id, { url })}
                  aspectRatio="photo"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E]">
                      Chú thích ảnh (Caption)
                    </label>
                    <input
                      type="text"
                      value={img.caption}
                      onChange={(e) =>
                        updateImageField(img.id, { caption: e.target.value })
                      }
                      placeholder="VD: Ánh nắng buổi sớm trên mái chùa"
                      className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-2 text-xs font-sans text-[#1C1B18] outline-hidden shadow-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E]">
                      Phân loại nguồn ảnh
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateImageField(img.id, { isRealPhoto: true })
                        }
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono transition-all cursor-pointer text-center ${
                          img.isRealPhoto
                            ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                            : 'bg-white text-stone-500 border border-stone-200'
                        }`}
                      >
                        ● Ảnh Sony A6400
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateImageField(img.id, { isRealPhoto: false })
                        }
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono transition-all cursor-pointer text-center ${
                          !img.isRealPhoto
                            ? 'bg-sky-100 text-sky-800 font-bold border border-sky-300'
                            : 'bg-white text-stone-500 border border-stone-200'
                        }`}
                      >
                        ○ Ảnh tham khảo web
                      </button>
                    </div>
                  </div>
                </div>

                {img.isRealPhoto && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E]">
                        Thiết bị máy ảnh & Lens
                      </label>
                      <input
                        type="text"
                        value={img.cameraGear}
                        onChange={(e) =>
                          updateImageField(img.id, { cameraGear: e.target.value })
                        }
                        placeholder="Sony A6400 • 18-135mm"
                        className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-1.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E]">
                        Thông số EXIF
                      </label>
                      <input
                        type="text"
                        value={img.exifInfo}
                        onChange={(e) =>
                          updateImageField(img.id, { exifInfo: e.target.value })
                        }
                        placeholder="35mm • f/4.0 • 1/250s • ISO 100"
                        className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-1.5 text-xs font-mono text-[#1C1B18] outline-hidden shadow-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleResetForNext}
            className="text-xs font-mono text-[#78756E] hover:text-[#1C1B18] px-4 py-2.5 rounded-xl border border-[#E6E2DA] hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            Làm lại form
          </button>

          <button
            type="submit"
            disabled={isSubmitting || trips.length === 0}
            className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#B93829]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu sự kiện...</span>
              </>
            ) : (
              <>
                <span>✓ LƯU SỰ KIỆN VÀO TIMELINE</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TimelineEventForm;
