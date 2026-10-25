'use client';

import React, { useEffect, useState } from 'react';

export interface StackPhoto {
  key: string | number;
  src: string;
  alt: string;
}

interface PhotoStackProps {
  photos: StackPhoto[];
  active: number;
  className?: string;
  /** Ảnh trôi chậm (chỉ dùng cho một ảnh lớn trên trang) */
  drift?: boolean;
  /** Chuyển nhanh (500ms) cho các danh sách tương tác */
  fast?: boolean;
  /** Ảnh đầu tiên nằm ở màn hình đầu: tải ngay */
  priority?: boolean;
}

/** Các ảnh chồng lên nhau trong một khung; chỉ ảnh đang chọn hiện ra, chuyển bằng crossfade */
export function PhotoStack({ photos, active, className = '', drift, fast, priority }: PhotoStackProps) {
  // Khung tự định vị (relative) trừ khi nơi dùng đã đặt absolute
  const position = /\babsolute\b/.test(className) ? '' : 'relative';
  return (
    <span className={`block ${position} overflow-hidden bg-surface ${fast ? 'stack-fast' : ''} ${className}`}>
      <span className={`block absolute inset-0 ${drift ? 'drift' : ''}`}>
        {photos.map((photo, i) => (
          <img
            key={photo.key}
            src={photo.src}
            alt={i === active ? photo.alt : ''}
            aria-hidden={i === active ? undefined : true}
            data-active={i === active}
            loading={priority && i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="stack-img"
          />
        ))}
      </span>
    </span>
  );
}

/** Tự chuyển ảnh theo nhịp; dừng khi tab ẩn, khi người đọc giảm chuyển động, hoặc khi `paused` */
export function useAutoAdvance(count: number, intervalMs: number, paused = false) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setIndex((i) => (i + 1) % count);
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs, paused]);

  return [index % Math.max(count, 1), setIndex] as const;
}

export default PhotoStack;
