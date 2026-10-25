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
import { categoryLabel, splitTimeSlot } from '@/lib/tripFormat';
import { AdminRoutePickerMap } from '@/components/itinerary/AdminRoutePickerMap';
import { PhotoFrame } from '@/components/ui/PhotoFrame';

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
  availableCities?: string[];
}

type EditorTab = 'info' | 'map' | 'photos';

const CATEGORIES = [
  { key: 'SIGHTSEEING', label: 'Tham quan' },
  { key: 'FOOD', label: 'Ẩm thực' },
  { key: 'TRANSIT', label: 'Di chuyển' },
  { key: 'HOTEL', label: 'Khách sạn' },
  { key: 'PHOTOGRAPHY', label: 'Chụp ảnh' },
];

function getTimePeriodLabel(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  const h = parseInt(match[1], 10);
  if (h >= 5 && h < 11) return 'Sáng';
  if (h >= 11 && h < 14) return 'Trưa';
  if (h >= 14 && h < 18) return 'Chiều';
  if (h >= 18 && h < 22) return 'Tối';
  return 'Đêm, rạng sáng';
}

// Ô nhập: nền đá, viền trong suốt, sáng lên khi focus; góc vuông như toàn trang
const fieldClass =
  'w-full bg-ground border border-transparent px-3.5 py-2.5 text-body text-ink outline-none transition-colors duration-200 placeholder:text-muted/60 hover:border-surface focus:border-ink focus:bg-paper';
const labelClass = 'block text-small font-semibold';

function Field({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
        {hint && <span className="text-small text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Ghi chú vàng giấy cho cảnh báo nhẹ, kèm nút xử lý nhanh nếu có */
function NoteBanner({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-(--note-ref) text-small">
      <p className="min-w-0">{children}</p>
      {action}
    </div>
  );
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
  availableCities,
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

  const [activeTab, setActiveTab] = useState<EditorTab>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validPhotos = useMemo(() => images.filter((img) => img.url.trim().length > 0), [images]);

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
      setActiveTab('info');
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
  const previewTime = splitTimeSlot(timeSlotPreview);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val && endTime) setIsOvernight(val > endTime);
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (startTime && val) setIsOvernight(startTime > val);
  };

  if (!isOpen || !mounted || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!locationName.trim()) {
      setActiveTab('info');
      setErrorMessage('Vui lòng nhập tên địa điểm hoặc hoạt động.');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      setActiveTab('info');
      setErrorMessage('Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc.');
      return;
    }

    const finalTimeSlot = formatTimeSlotRange(startTime, endTime, tripDate, isOvernight);

    const validImages = validPhotos.map((img) => ({
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
    if (!event) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa mốc sự kiện "${event.location_name}" cùng toàn bộ ảnh liên quan khỏi cơ sở dữ liệu không?`
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
        setErrorMessage('Supabase đang chặn quyền xóa dữ liệu (RLS). Vui lòng kiểm tra quyền trong Supabase.');
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

  const cityOptions =
    availableCities && availableCities.length > 0 ? availableCities : ['Tokyo', 'Kyoto', 'Osaka', 'Hà Nội'];
  const hasMap = mapEmbedUrl.trim().length > 0;
  const leadPhoto = validPhotos.find((p) => p.isRealPhoto) || validPhotos[0];

  const tabs: { key: EditorTab; label: string; meta?: string }[] = [
    { key: 'info', label: 'Thông tin chung' },
    { key: 'map', label: 'Bản đồ', meta: hasMap ? 'đã gắn' : undefined },
    { key: 'photos', label: 'Ảnh', meta: validPhotos.length > 0 ? String(validPhotos.length) : undefined },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-title"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6 bg-night/70"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl sm:h-[min(92svh,60rem)] bg-paper text-ink flex flex-col overflow-hidden"
      >
        {/* Đầu hộp: mốc đang sửa, tóm tắt thời gian, đóng */}
        <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-7 shrink-0">
          <div className="min-w-0">
            <p className="text-small text-muted tabular">
              Sửa mốc · Ngày {calculatedDayNumber}
              {previewTime.start && ` · ${previewTime.start}${previewTime.end ? ` - ${previewTime.end}` : ''}`}
            </p>
            <h2 id="edit-event-title" className="mt-1 text-lead leading-tight line-clamp-2">
              {locationName.trim() || event.location_name}
            </h2>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng (Esc)"
              title="Đóng (Esc)"
              className="w-10 h-10 flex items-center justify-center bg-ground text-lead leading-none cursor-pointer transition-colors duration-200 hover:bg-ink hover:text-paper"
            >
              ×
            </button>
          </div>
        </header>

        {/* Các mục biên tập: số thứ tự, gạch chân đỏ ở mục đang mở */}
        <nav aria-label="Các mục biên tập" className="flex gap-6 sm:gap-8 px-5 sm:px-8 mt-5 border-b border-surface shrink-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
          {tabs.map((tab, i) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-baseline gap-2 py-3 text-small shrink-0 cursor-pointer transition-colors duration-200 ${
                  active ? 'text-ink font-semibold' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="tabular opacity-60">{String(i + 1).padStart(2, '0')}</span>
                <span>{tab.label}</span>
                {tab.meta && <span className={`tabular ${active ? 'text-accent' : ''}`}>{tab.meta}</span>}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 bottom-0 h-0.5 transition-colors duration-200 ${active ? 'bg-accent' : 'bg-transparent'}`}
                />
              </button>
            );
          })}
        </nav>

        {/* Thân hộp cuộn riêng; thanh lưu bên dưới luôn hiện */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {errorMessage && (
            <div role="alert" className="mb-6 px-4 py-3 bg-accent text-accent-ink text-small">
              <span className="font-semibold">Chưa lưu được. </span>
              {errorMessage}
            </div>
          )}

          {/* 01: THÔNG TIN CHUNG, kèm bản xem trước bên phải */}
          {activeTab === 'info' && (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
              <div className="space-y-8 min-w-0">
                <section className="space-y-4">
                  <h3 className="text-small text-muted">Thời gian</h3>
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <Field label="Ngày thực tế" required>
                      <input
                        type="date"
                        required
                        value={tripDate}
                        onChange={(e) => setTripDate(e.target.value)}
                        className={`${fieldClass} tabular cursor-pointer`}
                      />
                    </Field>
                    <div className="space-y-2">
                      <span className={labelClass}>Thứ tự ngày</span>
                      <p className="h-11.5 px-4 flex items-center bg-ink text-paper font-semibold tabular whitespace-nowrap">
                        Ngày {calculatedDayNumber}
                      </p>
                    </div>
                  </div>

                  {isEarlierThanSchedule && earliestTripDate && (
                    <NoteBanner>
                      Ngày {tripDate} sớm hơn ngày đầu chuyến đi nên sẽ được xếp làm <strong>Ngày 1</strong>.
                    </NoteBanner>
                  )}

                  <div className="grid gap-4 grid-cols-2">
                    <Field label="Bắt đầu" required hint={getTimePeriodLabel(startTime)}>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className={`${fieldClass} tabular`}
                      />
                    </Field>
                    <Field label="Kết thúc" required hint={getTimePeriodLabel(endTime)}>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className={`${fieldClass} tabular`}
                      />
                    </Field>
                  </div>

                  {startTime.startsWith('00:') && (
                    <NoteBanner
                      action={
                        <button
                          type="button"
                          onClick={() => handleStartTimeChange(`12:${startTime.slice(3)}`)}
                          className="text-link font-semibold cursor-pointer"
                        >
                          Đổi thành 12:{startTime.slice(3)} trưa
                        </button>
                      }
                    >
                      Bắt đầu lúc <strong>{startTime}</strong> là nửa đêm.
                    </NoteBanner>
                  )}
                  {endTime.startsWith('00:') && (
                    <NoteBanner
                      action={
                        <button
                          type="button"
                          onClick={() => handleEndTimeChange(`12:${endTime.slice(3)}`)}
                          className="text-link font-semibold cursor-pointer"
                        >
                          Đổi thành 12:{endTime.slice(3)} trưa
                        </button>
                      }
                    >
                      Kết thúc lúc <strong>{endTime}</strong> là nửa đêm.
                    </NoteBanner>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer select-none text-small">
                    <input
                      type="checkbox"
                      checked={isOvernight}
                      onChange={(e) => setIsOvernight(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-(--accent) cursor-pointer"
                    />
                    <span>
                      <span className="font-semibold">Chặng qua đêm</span>
                      <span className="block text-muted">Kết thúc vào ngày hôm sau, ví dụ chuyến bay đêm.</span>
                    </span>
                  </label>
                </section>

                <section className="space-y-4">
                  <h3 className="text-small text-muted">Địa điểm</h3>
                  <Field label="Tên địa điểm hoặc hoạt động" required>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="VD: Chùa Kinkaku-ji (Gác Vàng)"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Thành phố" required>
                    <div className="flex flex-wrap gap-2">
                      {cityOptions.map((c) => {
                        const active = city.toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCity(c)}
                            aria-pressed={active}
                            className={`min-h-10 px-4 text-small cursor-pointer transition-colors duration-200 ${
                              active ? 'bg-ink text-paper font-semibold' : 'bg-ground hover:bg-surface'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Thành phố khác"
                        aria-label="Thành phố"
                        className={`${fieldClass} flex-1 min-w-40 py-2`}
                      />
                    </div>
                  </Field>
                  <Field label="Phân loại">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {CATEGORIES.map((cat) => {
                        const active = categoryTag === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setCategoryTag(cat.key)}
                            aria-pressed={active}
                            className={`min-h-11 px-3 text-small cursor-pointer transition-colors duration-200 ${
                              active ? 'bg-accent text-accent-ink font-semibold' : 'bg-ground hover:bg-surface'
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </section>

                <section className="space-y-4">
                  <h3 className="text-small text-muted">Ghi chú</h3>
                  <Field label="Ghi chú, góc chụp và kinh nghiệm thực tế" hint={notes.length > 0 ? `${notes.length} ký tự` : undefined}>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="VD: Nên đến trước 9h sáng để tránh đông."
                      className={`${fieldClass} resize-y leading-relaxed`}
                    />
                  </Field>
                </section>
              </div>

              {/* Xem trước: mốc sẽ hiện thế nào trên trang lịch trình */}
              <aside className="lg:sticky lg:top-0 self-start space-y-3">
                <p className="text-small text-muted">Xem trước trên lịch trình</p>
                <div className="bg-ground p-3">
                  <article className="bg-paper p-5 space-y-3">
                    <p className="flex items-center gap-2 text-lead leading-none tabular font-semibold whitespace-nowrap">
                      <span className="text-accent">{previewTime.start || '--:--'}</span>
                      {previewTime.end && (
                        <>
                          <span aria-hidden="true" className="block w-3 h-px bg-accent" />
                          <span className="text-muted">{previewTime.end}</span>
                        </>
                      )}
                    </p>
                    {(previewTime.duration || previewTime.endNote) && (
                      <p className="text-small text-muted tabular">
                        {[previewTime.duration, previewTime.endNote && `kết thúc ${previewTime.endNote}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="pt-2 text-small text-muted">
                      {categoryLabel(categoryTag)} · {city || 'Thành phố'}
                    </p>
                    <h4 className="text-lead leading-tight">{locationName.trim() || 'Tên địa điểm'}</h4>
                    {notes.trim() && <p className="text-small whitespace-pre-line line-clamp-4">{notes}</p>}
                    {leadPhoto && (
                      <div className="pt-3">
                        <PhotoFrame kind={leadPhoto.isRealPhoto ? 'real' : 'ref'} small>
                          <img src={leadPhoto.url} alt="" className="w-full aspect-4/3 object-cover bg-surface" />
                        </PhotoFrame>
                      </div>
                    )}
                    <p className="pt-1 flex flex-wrap gap-x-4 text-small">
                      {validPhotos.length > 0 && <span className="underline underline-offset-4">{validPhotos.length} ảnh</span>}
                      {hasMap && <span className="underline underline-offset-4">Xem tuyến đường</span>}
                    </p>
                  </article>
                </div>
              </aside>
            </div>
          )}

          {/* 02: BẢN ĐỒ */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <Field label="Link Google Maps" hint="Tùy chọn">
                <input
                  type="text"
                  value={mapEmbedUrl}
                  onChange={(e) => setMapEmbedUrl(e.target.value)}
                  placeholder="Dán link Google Maps hoặc mã <iframe>"
                  className={fieldClass}
                />
              </Field>
              <AdminRoutePickerMap
                initialCity={city}
                locationName={locationName}
                mapEmbedUrl={mapEmbedUrl}
                onMapEmbedUrlChange={setMapEmbedUrl}
              />
            </div>
          )}

          {/* 03: ẢNH */}
          {activeTab === 'photos' && (
            <TimelinePhotosManager
              images={images}
              onChange={setImages}
              city={city}
              tripSlug={tripSlug}
              tripTitle={tripTitle}
              tripDate={tripDate}
            />
          )}
        </div>

        {/* Thanh lưu: xóa bên trái, hủy và lưu bên phải */}
        <footer className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 border-t border-surface bg-paper">
          <button
            type="button"
            disabled={isDeleting || isSubmitting}
            onClick={handleDelete}
            className="text-small font-semibold text-accent hover:text-accent-deep underline underline-offset-4 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa mốc này'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-5 text-small font-semibold bg-ground hover:bg-surface cursor-pointer transition-colors duration-200"
            >
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting || isDeleting} className="btn min-h-11 disabled:opacity-60">
              {isSubmitting ? (
                <>
                  <span aria-hidden="true" className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body
  );
}

export default EditTimelineEventModal;
