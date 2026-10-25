'use client';

import React, { useRef } from 'react';

interface PhotoNavProps {
  index: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}

const arrowClass =
  'absolute top-1/2 -translate-y-1/2 z-[3] w-10 h-10 flex items-center justify-center bg-ink/75 text-paper text-lead leading-none cursor-pointer transition-colors duration-200 hover:bg-accent';

/** Nút ảnh trước / kế tiếp và bộ đếm, đặt đè lên khung ảnh; nơi dùng phải là khung `relative` */
export function PhotoNav({ index, count, onPrev, onNext }: PhotoNavProps) {
  if (count < 2) return null;
  return (
    <>
      <button type="button" onClick={onPrev} aria-label="Ảnh trước đó" className={`${arrowClass} left-3`}>
        ‹
      </button>
      <button type="button" onClick={onNext} aria-label="Ảnh kế tiếp" className={`${arrowClass} right-3`}>
        ›
      </button>
      <span
        aria-live="polite"
        className="absolute bottom-3 right-3 z-[3] px-2 py-1 bg-ink/75 text-paper text-small tabular pointer-events-none"
      >
        {index + 1}/{count}
      </span>
    </>
  );
}

/** Vuốt ngang trên màn hình cảm ứng để đổi ảnh */
export function useSwipe(onPrev: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      const dy = e.changedTouches[0].clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) onPrev();
        else onNext();
      }
    },
  };
}

/** Bước vòng tròn trong danh sách có `count` phần tử */
export function stepIndex(index: number, delta: number, count: number) {
  return (index + delta + count) % count;
}

export default PhotoNav;
