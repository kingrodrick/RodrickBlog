'use client';

import React, { useState, useMemo } from 'react';
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

  // Sắp xếp: Ưu tiên ảnh chụp thực tế (Sony A6400) trước, sau đó là ảnh nổi bật (is_featured), cuối cùng là ảnh tham khảo web
  const sortedImages = useMemo(() => {
    return [...rawImages].sort((a, b) => {
      const aReal = a.is_real_photo !== false ? 1 : 0;
      const bReal = b.is_real_photo !== false ? 1 : 0;
      if (aReal !== bReal) return bReal - aReal;
      const aFeat = a.is_featured ? 1 : 0;
      const bFeat = b.is_featured ? 1 : 0;
      return bFeat - aFeat;
    });
  }, [rawImages]);

  const realPhotos = useMemo(() => sortedImages.filter((img) => img.is_real_photo !== false), [sortedImages]);
  const refPhotos = useMemo(() => sortedImages.filter((img) => img.is_real_photo === false), [sortedImages]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'real' | 'ref'>('all');

  const displayImages = useMemo(() => {
    if (activeFilter === 'real') return realPhotos;
    if (activeFilter === 'ref') return refPhotos;
    return sortedImages;
  }, [sortedImages, realPhotos, refPhotos, activeFilter]);

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
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-rose-50 text-[#B93829] border border-rose-200 uppercase tracking-wider">
              {item.time_slot}
            </span>
            <span className={`font-mono text-[10px] px-2.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${badge.color}`}>
              {badge.icon} {badge.label}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F3F0EA] text-[#57544E] uppercase tracking-wider">
              📍 {item.city}
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

        {/* UNIFIED EDITORIAL PHOTO GALLERY */}
        {sortedImages.length > 0 && (
          <div className="pt-2 space-y-3">
            {/* Gallery Toolbar & Categorization */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-t border-[#F5F2EB] pt-3">
              {/* Category pills if both exist */}
              {realPhotos.length > 0 && refPhotos.length > 0 ? (
                <div className="flex items-center gap-1.5 p-1 bg-[#F3F0EA] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-white text-[#1C1B18] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Tất cả ({sortedImages.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('real')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activeFilter === 'real'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-800 hover:bg-emerald-100/60'
                    }`}
                  >
                    <span>📷</span>
                    <span>Sony A6400 ({realPhotos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ref')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activeFilter === 'ref'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-sky-800 hover:bg-sky-100/60'
                    }`}
                  >
                    <span>🌐</span>
                    <span>Tham khảo ({refPhotos.length})</span>
                  </button>
                </div>
              ) : realPhotos.length > 0 ? (
                <span className="flex items-center gap-1.5 text-emerald-800 font-semibold uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  ẢNH CHỤP THỰC TẾ (SONY A6400) • {realPhotos.length} KHUNG HÌNH GỐC
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sky-800 font-semibold uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  ẢNH TƯ LIỆU THAM KHẢO • {refPhotos.length} HÌNH ẢNH
                </span>
              )}

              <span className="text-[#8C8881] text-[10px] font-mono ml-auto">
                Nhấp ảnh để xem phóng to
              </span>
            </div>

            {/* Smart Editorial Grid based on photo count */}
            {displayImages.length === 1 && (
              <div className="w-full">
                <TimelinePhotoCard
                  image={displayImages[0]}
                  isReal={displayImages[0].is_real_photo !== false}
                  onOpen={onOpenImage}
                  className="h-64 sm:h-80 md:h-96 w-full"
                  showExifFull={true}
                />
              </div>
            )}

            {displayImages.length === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displayImages.map((img) => (
                  <TimelinePhotoCard
                    key={img.id}
                    image={img}
                    isReal={img.is_real_photo !== false}
                    onOpen={onOpenImage}
                    className="h-56 sm:h-72"
                  />
                ))}
              </div>
            )}

            {displayImages.length === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {displayImages.map((img) => (
                  <TimelinePhotoCard
                    key={img.id}
                    image={img}
                    isReal={img.is_real_photo !== false}
                    onOpen={onOpenImage}
                    className="h-56 sm:h-68"
                  />
                ))}
              </div>
            )}

            {displayImages.length === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displayImages.map((img) => (
                  <TimelinePhotoCard
                    key={img.id}
                    image={img}
                    isReal={img.is_real_photo !== false}
                    onOpen={onOpenImage}
                    className="h-52 sm:h-64"
                  />
                ))}
              </div>
            )}

            {displayImages.length >= 5 && (
              <div className="space-y-3.5">
                {/* Top 2 featured photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {displayImages.slice(0, 2).map((img) => (
                    <TimelinePhotoCard
                      key={img.id}
                      image={img}
                      isReal={img.is_real_photo !== false}
                      onOpen={onOpenImage}
                      className="h-56 sm:h-72"
                    />
                  ))}
                </div>

                {/* Bottom 3 photos with +remaining indicator if needed */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {displayImages.slice(2, 5).map((img, idx) => {
                    const isLast = idx === 2 && displayImages.length > 5;
                    const remainingCount = displayImages.length - 5;

                    return (
                      <div key={img.id} className="relative">
                        <TimelinePhotoCard
                          image={img}
                          isReal={img.is_real_photo !== false}
                          onOpen={onOpenImage}
                          className="h-44 sm:h-52"
                        />
                        {isLast && remainingCount > 0 && (
                          <div
                            onClick={() => onOpenImage?.(img)}
                            className="absolute inset-0 bg-black/75 hover:bg-black/65 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-white cursor-pointer transition-all border border-white/20 z-20"
                          >
                            <span className="font-serif text-2xl font-bold">+{remainingCount}</span>
                            <span className="font-mono text-[10px] text-stone-300 uppercase tracking-wider mt-0.5">
                              Xem toàn bộ ảnh
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for individual photo inside timeline card
function TimelinePhotoCard({
  image,
  isReal,
  onOpen,
  className = 'h-52 sm:h-64',
  showExifFull = false,
}: {
  image: GalleryImage;
  isReal: boolean;
  onOpen?: (image: GalleryImage) => void;
  className?: string;
  showExifFull?: boolean;
}) {
  const optimizedUrl = optimizeCloudinaryUrl(image.cloudinary_url);

  return (
    <div
      onClick={() => onOpen?.(image)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(image);
        }
      }}
      className={`group/img relative rounded-xl overflow-hidden border border-[#E6E2DA] cursor-pointer bg-[#F3F0EA] flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#D0C9BD] transition-all focus:outline-none focus:ring-2 focus:ring-[#B93829] ${className}`}
    >
      <img
        src={optimizedUrl}
        alt={image.caption || 'Hình ảnh lịch trình'}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
      />

      {/* Top Badges */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        {isReal ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SONY A6400</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-sky-950/85 text-sky-200 border border-sky-400/40 text-[10px] font-mono font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>THAM KHẢO</span>
          </span>
        )}

        <span className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-sm">
          <span>🔍</span>
          <span>Phóng to</span>
        </span>
      </div>

      {/* Bottom Gradient with Caption & EXIF */}
      <div className="relative z-10 p-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white space-y-1">
        {image.caption && (
          <p className="font-serif text-xs sm:text-sm font-medium line-clamp-1 text-white/95 leading-snug">
            {image.caption}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-stone-300 gap-2">
          <span className="truncate">
            {isReal
              ? `📷 ${image.camera_gear || 'Sony A6400 • 18-135mm'}`
              : '🌐 Tư liệu minh họa / Tham khảo'}
          </span>
          {isReal && image.exif_info && (
            <span className={`text-stone-300 ${showExifFull ? 'inline' : 'hidden sm:inline'}`}>
              ⚡ {image.exif_info}
            </span>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
    </div>
  );
}

export default TimelineItemCard;


