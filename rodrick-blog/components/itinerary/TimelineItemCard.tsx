'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEvent, GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { useAuth } from '@/components/auth/AuthContext';

interface TimelineItemCardProps {
  item: TimelineEvent;
  index?: number;
  onOpenImage?: (image: GalleryImage) => void;
  onEdit?: (item: TimelineEvent) => void;
}

export function TimelineItemCard({
  item,
  index,
  onOpenImage,
  onEdit,
}: TimelineItemCardProps) {
  const { isLoggedIn } = useAuth();

  // Category badge helper
  const getCategoryBadge = (tag?: string) => {
    switch (tag?.toUpperCase()) {
      case 'TRANSIT':
        return { label: 'Tàu / Di chuyển', icon: '🚄', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'FOOD':
        return { label: 'Ẩm thực', icon: '🍜', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'SIGHTSEEING':
        return { label: 'Danh thắng', icon: '⛩️', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'HOTEL':
        return { label: 'Nghỉ ngơi', icon: '🏨', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: tag || 'Lịch trình', icon: '📍', color: 'bg-stone-50 text-stone-700 border-stone-200' };
    }
  };

  const badge = getCategoryBadge(item.category_tag);
  const rawImages = item.images || [];

  // Phân chia rành mạch: Ảnh chụp thực tế (Sony A6400) vs Ảnh tham khảo / tư liệu web
  const realPhotos = useMemo(() => {
    return rawImages
      .filter((img) => img.is_real_photo !== false)
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }, [rawImages]);

  const refPhotos = useMemo(() => {
    return rawImages
      .filter((img) => img.is_real_photo === false)
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }, [rawImages]);

  // Modal State để xem toàn bộ ảnh hoặc phóng to từng ảnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'real' | 'ref' | 'all'>('real');
  const [modalViewMode, setModalViewMode] = useState<'grid' | 'lightbox'>('grid');
  const [modalIndex, setModalIndex] = useState(0);

  const handleOpenGallery = (
    tab: 'real' | 'ref' | 'all',
    startIndex = 0,
    viewMode: 'grid' | 'lightbox' = 'grid'
  ) => {
    setModalTab(tab);
    setModalIndex(startIndex);
    setModalViewMode(viewMode);
    setIsModalOpen(true);
  };

  return (
    <div className="relative pl-6 sm:pl-10 group">
      {/* Timeline indicator node with sequential number */}
      <div className="absolute -left-[15px] top-4 w-7 h-7 rounded-full bg-white border-2 border-[#B93829] flex items-center justify-center font-mono text-xs font-bold text-[#B93829] shadow-xs z-10 group-hover:bg-[#B93829] group-hover:text-white transition-all">
        {index ?? item.day_number}
      </div>

      {/* Card Content */}
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#D0C9BD] transition-all space-y-4">
        {/* Header tags & Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE4] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-green-200 text-green-800 border border-green-800 uppercase tracking-wider">
              📍 {item.city}
            </span>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-rose-50 text-[#B93829] border border-rose-200 uppercase tracking-wider">
              {item.time_slot}
            </span>
            <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${badge.color}`}>
              {badge.icon} {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-[#8C8881]">
              🗓 {item.trip_date}
            </span>

            {/* Edit Button for Authenticated Editor */}
            {isLoggedIn && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#B93829] text-stone-700 hover:text-white border border-[#E6E2DA] hover:border-[#B93829] font-mono text-[11px] font-semibold transition-all cursor-pointer shadow-2xs group/btn"
                title="Chỉnh sửa thông tin và hình ảnh sự kiện này"
              >
                <span className="text-xs group-hover/btn:scale-110 transition-transform">✏️</span>
                <span>Sửa mốc này</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Title */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] tracking-tight leading-snug">
          {item.location_name}
        </h3>

        {/* Notes & Tips */}
        {item.notes && (
          <div className="text-xs sm:text-sm text-[#4A4742] font-normal italic leading-relaxed whitespace-pre-line font-sans bg-[#FAF8F5] p-4 rounded-xl border border-[#EFECE4]">
            {item.notes}
          </div>
        )}

        {/* TÁCH BẠCH RÕ RÀNG: ẢNH CHỤP THỰC TẾ & ẢNH THAM KHẢO (PHOTO STACKS) */}
        {rawImages.length > 0 && (
          <div className="pt-2 space-y-4">
            {/* TH1: Có cả ảnh thực tế và ảnh tham khảo -> 2 cột song song */}
            {realPhotos.length > 0 && refPhotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Cột 1: Tệp ảnh tư liệu tham khảo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-600" />
                      <span>ẢNH TƯ LIỆU THAM KHẢO</span>
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {refPhotos.length} ảnh
                    </span>
                  </div>

                  <PhotoStackCard
                    title="Ảnh tư liệu tham khảo"
                    badgeType="ref"
                    images={refPhotos}
                    onOpenStack={(mode) => handleOpenGallery('ref', 0, mode)}
                  />
                </div>

                {/* Cột 2: Tệp ảnh chụp thực tế */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>ẢNH CHỤP THỰC TẾ (SONY A6400)</span>
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {realPhotos.length} ảnh
                    </span>
                  </div>

                  <PhotoStackCard
                    title="Ảnh chụp thực tế Sony A6400"
                    badgeType="real"
                    images={realPhotos}
                    onOpenStack={(mode) => handleOpenGallery('real', 0, mode)}
                  />
                </div>
              </div>
            ) : realPhotos.length > 0 ? (
              /* TH2: Chỉ có ảnh chụp thực tế */
              <div className="max-w-xl space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>ẢNH CHỤP THỰC TẾ (SONY A6400)</span>
                  </span>
                  <span className="font-mono text-[10px] text-stone-500 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {realPhotos.length} ảnh
                  </span>
                </div>

                <PhotoStackCard
                  title="Ảnh chụp thực tế Sony A6400"
                  badgeType="real"
                  images={realPhotos}
                  onOpenStack={(mode) => handleOpenGallery('real', 0, mode)}
                />
              </div>
            ) : (
              /* TH3: Chỉ có ảnh tham khảo */
              <div className="max-w-xl space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    <span>ẢNH TƯ LIỆU THAM KHẢO</span>
                  </span>
                  <span className="font-mono text-[10px] text-stone-500 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {refPhotos.length} ảnh
                  </span>
                </div>

                <PhotoStackCard
                  title="Ảnh tư liệu tham khảo"
                  badgeType="ref"
                  images={refPhotos}
                  onOpenStack={(mode) => handleOpenGallery('ref', 0, mode)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL TOÀN DIỆN: XEM TOÀN BỘ ẢNH DẠNG LƯỚI HOẶC PHÓNG TO TỪNG ẢNH */}
      {isModalOpen && (
        <TimelineGalleryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locationName={item.location_name}
          timeSlot={item.time_slot}
          city={item.city}
          dayNumber={item.day_number}
          realPhotos={realPhotos}
          refPhotos={refPhotos}
          initialTab={modalTab}
          initialViewMode={modalViewMode}
          initialIndex={modalIndex}
          onOpenExternalImage={onOpenImage}
        />
      )}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: PHOTO STACK CARD (Tệp ảnh xếp lớp Polaroid 3D)
// =========================================================================
interface PhotoStackCardProps {
  title: string;
  badgeType: 'real' | 'ref';
  images: GalleryImage[];
  onOpenStack: (mode: 'grid' | 'lightbox') => void;
}

function PhotoStackCard({
  title,
  badgeType,
  images,
  onOpenStack,
}: PhotoStackCardProps) {
  if (images.length === 0) return null;

  const mainImage = images[0];
  const secondImage = images[1];
  const thirdImage = images[2];

  return (
    <div
      onClick={() => onOpenStack(images.length > 1 ? 'grid' : 'lightbox')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenStack(images.length > 1 ? 'grid' : 'lightbox');
        }
      }}
      className="group/stack relative pt-3 pb-3 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B93829] rounded-2xl"
    >
      {/* Lớp ảnh thứ 3 phía sau (nếu có từ 3 ảnh trở lên) */}
      {images.length >= 3 && (
        <div
          aria-hidden="true"
          className="absolute inset-x-3.5 top-0.5 bottom-5 rounded-2xl bg-[#E2DED6] border-2 border-white shadow-xs -rotate-3 transition-transform duration-300 ease-out group-hover/stack:-rotate-6 group-hover/stack:-translate-x-2 group-hover/stack:-translate-y-1 overflow-hidden"
        >
          {thirdImage && (
            <img
              src={optimizeCloudinaryUrl(thirdImage.cloudinary_url)}
              alt=""
              className="w-full h-full object-cover filter brightness-90 contrast-95 opacity-85"
            />
          )}
          <div className="absolute inset-0 bg-stone-900/15" />
        </div>
      )}

      {/* Lớp ảnh thứ 2 phía sau (nếu có từ 2 ảnh trở lên) */}
      {images.length >= 2 && (
        <div
          aria-hidden="true"
          className="absolute inset-x-1.5 top-2 bottom-3.5 rounded-2xl bg-[#ECE8E0] border-2 border-white shadow-sm rotate-2 transition-transform duration-300 ease-out group-hover/stack:rotate-4 group-hover/stack:translate-x-2 group-hover/stack:-translate-y-1 overflow-hidden"
        >
          {secondImage && (
            <img
              src={optimizeCloudinaryUrl(secondImage.cloudinary_url)}
              alt=""
              className="w-full h-full object-cover filter brightness-95 opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-stone-900/10" />
        </div>
      )}

      {/* Lớp ảnh chính hiển thị ở trên cùng */}
      <div className="relative z-10 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-stone-100 transition-all duration-300 group-hover/stack:shadow-xl group-hover/stack:-translate-y-1 group-hover/stack:border-[#D0C9BD]">
        <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-stone-200">
          <img
            src={optimizeCloudinaryUrl(mainImage.cloudinary_url)}
            alt={mainImage.caption || title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/stack:scale-105"
            loading="lazy"
          />

          {/* Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
            {badgeType === 'real' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SONY A6400</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-sky-950/85 text-sky-200 border border-sky-400/40 text-[10px] font-mono font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>THAM KHẢO</span>
              </span>
            )}

            {/* Badge đếm số ảnh trong tệp */}
            <span className="px-2.5 py-1 rounded-full bg-black/75 text-white border border-white/20 text-[10px] font-mono font-medium backdrop-blur-md flex items-center gap-1.5 shadow-sm group-hover/stack:bg-black/90 transition-all">
              <span>🗂️</span>
              <span>{images.length > 1 ? `Tệp ${images.length} ảnh` : '1 ảnh'}</span>
            </span>
          </div>

          {/* Center Hover Action Pill */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/stack:opacity-100 transition-opacity duration-200 bg-black/35 backdrop-blur-[2px] z-10">
            <div className="px-4 py-2 rounded-full bg-white/95 text-stone-900 font-mono text-xs font-bold shadow-lg flex items-center gap-2 transform translate-y-2 group-hover/stack:translate-y-0 transition-transform">
              <span>{images.length > 1 ? '🗂️' : '🔍'}</span>
              <span>{images.length > 1 ? `Xem toàn bộ ${images.length} ảnh` : 'Phóng to ảnh'}</span>
            </div>
          </div>

          {/* Bottom Gradient with Caption & Sub-info */}
          <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white space-y-1 z-10 pointer-events-none">
            {mainImage.caption && (
              <p className="font-serif text-xs sm:text-sm font-semibold line-clamp-1 text-white/95 leading-snug">
                {mainImage.caption}
              </p>
            )}
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-300">
              <span className="truncate max-w-[70%]">
                {badgeType === 'real'
                  ? `📷 ${mainImage.camera_gear || 'Sony A6400 • 18-135mm'}`
                  : '🌐 Tư liệu minh họa / Tham khảo'}
              </span>
              <span className="text-[#C59F60] font-semibold text-[10px] uppercase tracking-wider shrink-0">
                {images.length > 1 ? `+${images.length - 1} ảnh sau` : 'Chi tiết'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: TIMELINE GALLERY MODAL (Xem toàn bộ lưới ảnh hoặc Phóng to)
// =========================================================================
interface TimelineGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  timeSlot: string;
  city: string;
  dayNumber: number;
  realPhotos: GalleryImage[];
  refPhotos: GalleryImage[];
  initialTab?: 'real' | 'ref' | 'all';
  initialViewMode?: 'grid' | 'lightbox';
  initialIndex?: number;
  onOpenExternalImage?: (img: GalleryImage) => void;
}

function TimelineGalleryModal({
  isOpen,
  onClose,
  locationName,
  timeSlot,
  city,
  dayNumber,
  realPhotos,
  refPhotos,
  initialTab = 'real',
  initialViewMode = 'grid',
  initialIndex = 0,
  onOpenExternalImage,
}: TimelineGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<'real' | 'ref' | 'all'>(() => {
    if (initialTab === 'real' && realPhotos.length > 0) return 'real';
    if (initialTab === 'ref' && refPhotos.length > 0) return 'ref';
    return realPhotos.length > 0 ? 'real' : refPhotos.length > 0 ? 'ref' : 'all';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'lightbox'>(initialViewMode);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const allImages = useMemo(() => [...realPhotos, ...refPhotos], [realPhotos, refPhotos]);

  const currentImageList = useMemo(() => {
    if (activeTab === 'real') return realPhotos;
    if (activeTab === 'ref') return refPhotos;
    return allImages;
  }, [activeTab, realPhotos, refPhotos, allImages]);

  // Đảm bảo currentIndex luôn hợp lệ
  const safeIndex = Math.min(
    Math.max(0, currentIndex),
    Math.max(0, currentImageList.length - 1)
  );
  const activeImage = currentImageList[safeIndex];

  // Bàn phím điều hướng (Esc để đóng, mũi tên Trái/Phải để chuyển ảnh khi phóng to)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (viewMode === 'lightbox') {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : currentImageList.length - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex((prev) => (prev < currentImageList.length - 1 ? prev + 1 : 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, viewMode, currentImageList.length]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[94vh] bg-[#1C1B18] text-white rounded-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================================================================== */}
        {/* MODAL HEADER                                                        */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 sm:py-4 border-b border-white/10 bg-[#161513] shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400">
              <span className="text-[#C59F60]">📍 {city}</span>
              <span>•</span>
              <span>{timeSlot}</span>
              <span>•</span>
              <span>Ngày {dayNumber}</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5 truncate max-w-lg">
              {locationName}
            </h3>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Chuyển đổi qua lại giữa Chế độ Lưới (Grid) và Phóng to (Lightbox) */}
            <div className="flex items-center p-0.5 rounded-lg bg-white/10 border border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Xem danh sách tất cả các ảnh dạng lưới"
              >
                <span>⊞</span>
                <span className="hidden sm:inline">Lưới ảnh</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lightbox')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'lightbox'
                    ? 'bg-white text-stone-900 font-bold shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Xem phóng to từng ảnh"
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Phóng to</span>
              </button>
            </div>

            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/15 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>✕</span>
              <span className="hidden sm:inline">Đóng (ESC)</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MODAL TABS (Phân chia Ảnh thực tế vs Ảnh tham khảo)                 */}
        {/* =================================================================== */}
        {realPhotos.length > 0 && refPhotos.length > 0 && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-black/30 border-b border-white/10 text-xs font-mono shrink-0">
            <span className="text-stone-400 text-[11px] mr-1 hidden sm:inline">Phân loại:</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('real');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'real'
                  ? 'bg-emerald-800 text-white font-bold border border-emerald-400/50 shadow-xs'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>📷 Ảnh thực tế ({realPhotos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ref');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ref'
                  ? 'bg-sky-800 text-white font-bold border border-sky-400/50 shadow-xs'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>🌐 Ảnh tham khảo ({refPhotos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-stone-200 text-stone-900 font-bold shadow-xs'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
              }`}
            >
              Tất cả ({allImages.length})
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL BODY: VIEW MODE 1 - GRID OVERVIEW (Xem toàn bộ ảnh dạng lưới) */}
        {/* =================================================================== */}
        {viewMode === 'grid' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-stone-400 border-b border-white/10 pb-2">
              <span>
                Hiển thị {currentImageList.length} bức ảnh trong tệp • Nhấp vào ảnh để xem phóng to
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setViewMode('lightbox');
                }}
                className="text-[#C59F60] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Bắt đầu trình chiếu</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {currentImageList.map((img, idx) => {
                const isReal = img.is_real_photo !== false;
                return (
                  <div
                    key={img.id || idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setViewMode('lightbox');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCurrentIndex(idx);
                        setViewMode('lightbox');
                      }
                    }}
                    className="group/grid relative aspect-[4/3] rounded-xl overflow-hidden border border-white/15 bg-stone-900 cursor-pointer shadow-md hover:border-[#C59F60] hover:scale-[1.02] transition-all"
                  >
                    <img
                      src={optimizeCloudinaryUrl(img.cloudinary_url)}
                      alt={img.caption || locationName}
                      className="w-full h-full object-cover group-hover/grid:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Badge góc trên */}
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      {isReal ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-semibold backdrop-blur-xs flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          <span>A6400</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-200 border border-sky-400/40 text-[9px] font-mono font-semibold backdrop-blur-xs">
                          Tham khảo
                        </span>
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/grid:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono gap-1 backdrop-blur-xs">
                      <span>🔍</span>
                      <span>Phóng to</span>
                    </div>

                    {/* Caption ngắn */}
                    {img.caption && (
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-[11px] font-serif text-white/90 line-clamp-1 pointer-events-none">
                        {img.caption}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL BODY: VIEW MODE 2 - LIGHTBOX ZOOM (Phóng to từng ảnh)         */}
        {/* =================================================================== */}
        {viewMode === 'lightbox' && activeImage && (
          <div className="flex-1 flex flex-col overflow-hidden bg-black/70">
            {/* Vùng hiển thị ảnh lớn */}
            <div className="relative flex-1 min-h-[48vh] max-h-[62vh] flex items-center justify-center p-3 sm:p-5 select-none overflow-hidden">
              <img
                src={optimizeCloudinaryUrl(activeImage.cloudinary_url)}
                alt={activeImage.caption || locationName}
                className="max-h-[58vh] max-w-full w-auto object-contain rounded-lg shadow-2xl transition-all"
              />

              {/* Nút Prev (Ảnh trước) */}
              {currentImageList.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : currentImageList.length - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg hover:scale-110"
                  aria-label="Ảnh trước đó"
                >
                  <span className="text-lg">‹</span>
                </button>
              )}

              {/* Nút Next (Ảnh tiếp theo) */}
              {currentImageList.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev < currentImageList.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg hover:scale-110"
                  aria-label="Ảnh kế tiếp"
                >
                  <span className="text-lg">›</span>
                </button>
              )}

              {/* Floating Counter Pill */}
              <div className="absolute top-4 right-4 bg-black/70 text-white font-mono text-xs px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
                Ảnh {safeIndex + 1} / {currentImageList.length}
              </div>
            </div>

            {/* Dải Thumbnail lướt nhanh phía dưới */}
            {currentImageList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 sm:px-6 bg-[#161513] border-t border-white/10 shrink-0">
                {currentImageList.map((thumb, idx) => (
                  <button
                    key={thumb.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === safeIndex
                        ? 'border-[#B93829] scale-105 shadow-md ring-2 ring-[#B93829]/40'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={optimizeCloudinaryUrl(thumb.cloudinary_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Thanh thông tin chi tiết đáy ảnh (Caption & EXIF) */}
            <div className="p-4 sm:px-6 sm:py-3.5 bg-[#121110] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  {activeImage.is_real_photo !== false ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ẢNH CHỤP THỰC TẾ (SONY ALPHA A6400)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 text-sky-200 border border-sky-400/40 text-[10px] font-mono font-semibold">
                      <span>🌐</span>
                      ẢNH MINH HỌA / THAM KHẢO LỊCH TRÌNH
                    </span>
                  )}
                </div>

                {activeImage.caption && (
                  <p className="font-serif text-sm sm:text-base text-white/95 leading-snug">
                    {activeImage.caption}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-400">
                  {activeImage.city && <span>📍 {activeImage.city}</span>}
                  {activeImage.taken_at && <span>🗓 {activeImage.taken_at}</span>}
                </div>
              </div>

              {/* Thông số kỹ thuật / Thiết bị máy ảnh */}
              <div className="flex flex-col sm:items-end gap-1 font-mono text-[11px] text-stone-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shrink-0">
                <span className="text-[#E6E2DA] font-semibold">
                  {activeImage.is_real_photo !== false
                    ? `📷 ${activeImage.camera_gear || 'Sony A6400 • 18-135mm OSS'}`
                    : '🌐 Tư liệu tham khảo web'}
                </span>
                {activeImage.is_real_photo !== false && activeImage.exif_info && (
                  <span className="text-stone-400">⚡ {activeImage.exif_info}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineItemCard;
