'use client';

import React from 'react';
import { TimelineEvent, GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface TimelineItemCardProps {
  item: TimelineEvent;
  index?: number;
  onOpenImage?: (image: GalleryImage) => void;
}

export function TimelineItemCard({
  item,
  index,
  onOpenImage,
}: TimelineItemCardProps) {
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
  const images = item.images || [];

  // Phân loại ảnh thực tế (Sony A6400) vs ảnh minh họa / tham khảo web
  const realPhotos = images.filter((img) => img.is_real_photo !== false);
  const refPhotos = images.filter((img) => img.is_real_photo === false);

  return (
    <div className="relative pl-6 sm:pl-10 group">
      {/* Timeline indicator node with sequential number */}
      <div className="absolute -left-[15px] top-4 w-7 h-7 rounded-full bg-white border-2 border-[#B93829] flex items-center justify-center font-mono text-xs font-bold text-[#B93829] shadow-xs z-10 group-hover:bg-[#B93829] group-hover:text-white transition-all">
        {index ?? item.day_number}
      </div>

      {/* Card Content */}
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#D0C9BD] transition-all space-y-4">
        {/* Header tags */}
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

          <span className="font-mono text-[11px] text-[#8C8881]">
            🗓 {item.trip_date}
          </span>
        </div>

        {/* Location Title */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1B18] tracking-tight leading-snug">
          {item.location_name}
        </h3>

        {/* Notes & Tips */}
        {item.notes && (
          <div className="text-xs sm:text-sm text-[#4A4742] leading-relaxed whitespace-pre-line font-sans bg-[#FAF8F5] p-4 rounded-xl border border-[#EFECE4] space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#8C8881] font-semibold mb-1">
              Ghi chú hành trình & trải nghiệm:
            </div>
            {item.notes}
          </div>
        )}

        {/* IMAGES SECTION: 1. ẢNH CHỤP THỰC TẾ (SONY A6400) */}
        {realPhotos.length > 0 && (
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-800 font-semibold uppercase tracking-wider text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                ẢNH CHỤP THỰC TẾ (SONY A6400)
              </span>
              <span className="text-[#8C8881] text-[10px]">
                {realPhotos.length} khung hình gốc
              </span>
            </div>

            <div
              className={`grid gap-3.5 ${
                realPhotos.length === 1
                  ? 'grid-cols-1'
                  : realPhotos.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {realPhotos.map((img) => (
                <TimelinePhotoCard
                  key={img.id}
                  image={img}
                  isReal={true}
                  onOpen={onOpenImage}
                />
              ))}
            </div>
          </div>
        )}

        {/* IMAGES SECTION: 2. ẢNH MINH HỌA / THAM KHẢO WEB */}
        {refPhotos.length > 0 && (
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-sky-800 font-semibold uppercase tracking-wider text-[11px]">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                ẢNH MINH HỌA / THAM KHẢO WEB
              </span>
              <span className="text-[#8C8881] text-[10px]">
                {refPhotos.length} ảnh tư liệu
              </span>
            </div>

            <div
              className={`grid gap-3.5 ${
                refPhotos.length === 1
                  ? 'grid-cols-1'
                  : refPhotos.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {refPhotos.map((img) => (
                <TimelinePhotoCard
                  key={img.id}
                  image={img}
                  isReal={false}
                  onOpen={onOpenImage}
                />
              ))}
            </div>
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
}: {
  image: GalleryImage;
  isReal: boolean;
  onOpen?: (image: GalleryImage) => void;
}) {
  const optimizedUrl = optimizeCloudinaryUrl(image.cloudinary_url);

  return (
    <div
      onClick={() => onOpen?.(image)}
      className="group/img relative h-52 sm:h-64 rounded-xl overflow-hidden border border-[#E6E2DA] cursor-pointer bg-[#F3F0EA] flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#D0C9BD] transition-all"
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
            <span>📷</span>
            <span>ẢNH THỰC TẾ (SONY A6400)</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-sky-950/85 text-sky-200 border border-sky-400/40 text-[10px] font-mono font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
            <span>🌐</span>
            <span>ẢNH THAM KHẢO WEB</span>
          </span>
        )}

        <span className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-full backdrop-blur-xs">
          🔍 Phóng to
        </span>
      </div>

      {/* Bottom Gradient with Caption & EXIF */}
      <div className="relative z-10 p-3.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white space-y-1">
        {image.caption && (
          <p className="font-serif text-xs sm:text-sm font-medium line-clamp-1 text-white/95 leading-snug">
            {image.caption}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-stone-300">
          <span>
            {isReal
              ? `📷 ${image.camera_gear || 'Sony A6400 • 18-135mm'}`
              : '🌐 Tư liệu minh họa / Tham khảo'}
          </span>
          {isReal && image.exif_info && (
            <span className="text-stone-400 hidden sm:inline">⚡ {image.exif_info}</span>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
    </div>
  );
}

export default TimelineItemCard;

