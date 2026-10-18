'use client';

import React from 'react';
import { GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface PhotoCardProps {
  image: GalleryImage;
  onClick: (image: GalleryImage) => void;
}

export function PhotoCard({ image, onClick }: PhotoCardProps) {
  const optimizedUrl = optimizeCloudinaryUrl(image.cloudinary_url);

  return (
    <article
      onClick={() => onClick(image)}
      className="group bg-white border border-[#E6E2DA] rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#D0C9BD] transition-all cursor-pointer flex flex-col justify-between"
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F3F0EA]">
        <img
          src={optimizedUrl}
          alt={image.caption || 'Sony A6400 Photo'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-white bg-black/60 px-3 py-1.5 rounded-full transition-opacity backdrop-blur-xs">
            🔍 Xem chi tiết
          </span>
        </div>

        {/* City & Gear tags */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {image.city && (
            <span className="bg-black/65 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
              📍 {image.city}
            </span>
          )}
          {image.is_real_photo === false && (
            <span className="bg-sky-900/80 text-sky-200 border border-sky-400/30 text-[10px] font-mono px-2 py-0.5 rounded font-semibold backdrop-blur-xs">
              🌐 THAM KHẢO
            </span>
          )}
          {image.is_featured && (
            <span className="bg-[#B93829] text-white text-[10px] font-mono px-2 py-0.5 rounded font-semibold">
              ★ FEATURED
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        {image.caption ? (
          <h4 className="font-serif text-sm sm:text-base font-semibold text-[#1C1B18] line-clamp-2 leading-snug">
            {image.caption}
          </h4>
        ) : (
          <span className="font-serif italic text-xs text-[#78756E]">
            Ảnh không tiêu đề
          </span>
        )}

        {/* EXIF Metadata Bar */}
        <div className="pt-2 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#78756E]">
          <span className="text-[#1C1B18] font-medium">
            📷 {image.camera_gear || 'Sony A6400'}
          </span>
          {image.exif_info && (
            <span className="text-[#8C8881]">{image.exif_info}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default PhotoCard;
