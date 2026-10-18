'use client';

import React, { useEffect } from 'react';
import { GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface ImageLightboxModalProps {
  image: GalleryImage | null;
  onClose: () => void;
}

export function ImageLightboxModal({ image, onClose }: ImageLightboxModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (image) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [image, onClose]);

  if (!image) return null;

  const optimizedUrl = optimizeCloudinaryUrl(image.cloudinary_url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute -top-10 right-0 text-white/80 hover:text-white font-mono text-xs uppercase px-3 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all cursor-pointer"
        >
          ✕ ĐÓNG (ESC)
        </button>

        {/* Image */}
        <div className="relative max-h-[75vh] w-auto overflow-hidden rounded-lg border border-white/15 shadow-2xl bg-black">
          <img
            src={optimizedUrl}
            alt={image.caption || 'Ảnh chụp Sony A6400'}
            className="max-h-[75vh] w-auto object-contain mx-auto"
          />
        </div>

        {/* Metadata & EXIF Info Bar */}
        <div className="mt-3.5 w-full bg-[#1C1B18]/90 text-white p-4 sm:p-5 rounded-xl border border-white/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1.5 max-w-xl">
            {/* Real vs Ref Badge */}
            <div>
              {image.is_real_photo !== false ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ẢNH CHỤP THỰC TẾ (SONY A6400)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 text-sky-200 border border-sky-400/40 text-[10px] font-mono font-semibold">
                  <span>🌐</span>
                  ẢNH MINH HỌA / THAM KHẢO WEB
                </span>
              )}
            </div>

            {image.caption && (
              <p className="font-serif text-sm sm:text-base text-white/95 leading-snug">
                {image.caption}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-400">
              {image.city && <span>📍 {image.city}</span>}
              {image.taken_at && <span>🗓 {image.taken_at}</span>}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 font-mono text-[11px] text-stone-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10 shrink-0">
            <span className="text-[#E6E2DA] font-semibold">
              {image.is_real_photo !== false
                ? `📷 ${image.camera_gear || 'Sony A6400 • 18-135mm'}`
                : '🌐 Tư liệu tham khảo web'}
            </span>
            {image.is_real_photo !== false && image.exif_info ? (
              <span className="text-stone-400">⚡ {image.exif_info}</span>
            ) : (
              <span className="text-stone-400">Ảnh minh họa chặng lịch trình</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageLightboxModal;
