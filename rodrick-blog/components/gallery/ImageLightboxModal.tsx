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
  const isReal = image.is_real_photo !== false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.caption || 'Ảnh phóng to'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/95 text-night-ink p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full max-h-full flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 px-4 text-small font-semibold bg-night-ink text-night cursor-pointer transition-colors duration-200 hover:bg-accent hover:text-accent-ink"
          >
            Đóng (Esc)
          </button>
        </div>

        <img
          src={optimizedUrl}
          alt={image.caption || 'Ảnh chụp Sony A6400'}
          className="max-h-[72svh] w-auto max-w-full object-contain self-center"
        />

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1 max-w-[60ch]">
            {image.caption && <p className="text-lead leading-snug">{image.caption}</p>}
            <p className="text-small">
              {isReal ? 'Ảnh chụp thực tế (Sony A6400)' : 'Ảnh minh họa, tham khảo web'}
              {image.city ? `. ${image.city}` : ''}
              {image.taken_at ? `, ${image.taken_at}` : ''}
            </p>
          </div>

          <p className="text-small sm:text-right shrink-0">
            {isReal ? image.camera_gear || 'Sony A6400 • 18-135mm' : 'Tư liệu tham khảo web'}
            <br />
            {isReal && image.exif_info ? image.exif_info : !isReal ? 'Ảnh minh họa chặng lịch trình' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImageLightboxModal;
