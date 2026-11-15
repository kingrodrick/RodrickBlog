'use client';

import React, { useEffect, useRef, useState } from 'react';

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

interface PhotoDotsProps {
  index: number;
  count: number;
  onPick: (index: number) => void;
}

/** Hàng gạch chỉ vị trí ảnh (kiểu carousel) đặt dưới ảnh; bấm một gạch để tới ảnh đó. Màu theo `color` của nơi chứa */
export function PhotoDots({ index, count, onPick }: PhotoDotsProps) {
  if (count < 2) return null;
  return (
    <span className="photo-dots" aria-label={`Ảnh ${index + 1} trên ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={`Xem ảnh ${i + 1}`}
          aria-current={i === index ? 'true' : undefined}
          className="photo-dot"
        >
          <span />
        </button>
      ))}
    </span>
  );
}

interface PhotoThumbsProps {
  photos: { key: string | number; src: string; alt: string }[];
  index: number;
  onPick: (index: number) => void;
  /** Hiện cả khi chỉ có một ảnh (mặc định cần từ hai ảnh) */
  allowSingle?: boolean;
}

/** Đổi giá trị độ dài CSS ("4.5rem", "24px") ra px */
function cssLengthPx(raw: string, fallback: number) {
  const v = raw.trim();
  if (v.endsWith('rem')) {
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(v) * rootPx;
  }
  return parseFloat(v) || fallback;
}

/**
 * Hàng ảnh mini dưới khung ảnh: bấm một ảnh để xem ảnh đó; ảnh đang xem có viền màu của tab.
 * Hàng chỉ có một dòng. Nếu không đủ chỗ cho hết ảnh thì hai đầu hàng có nút mũi tên để trượt
 * xem các ảnh còn lại (mỗi lần trượt một trang), kèm dòng đếm "xx ảnh / yy ảnh" bên dưới.
 * Khi ảnh đang xem đổi (cuộn chuột, bấm chấm) mà nằm ngoài phần đang hiện, hàng tự trượt tới nó.
 * Dòng đầy thì các ô giãn đều để cả hàng rộng bằng khung ảnh phía trên.
 */
export function PhotoThumbs({ photos, index, onPick, allowSingle }: PhotoThumbsProps) {
  const strip = useRef<HTMLDivElement>(null);
  // Số đo của hàng: bề ngang, bề ngang chuẩn một ô (--thumb-w), nút mũi tên (--thumb-nav-w) và khoảng cách.
  // Không đo ô thật vì khi dòng đầy các ô giãn ra cho khớp bề ngang khung.
  const [box, setBox] = useState<{ width: number; cell: number; nav: number; gap: number } | null>(null);
  const [start, setStart] = useState(0);
  const [prevIndex, setPrevIndex] = useState(index);
  const count = photos.length;
  const hasStrip = count >= (allowSingle ? 1 : 2);

  // Đo lại mỗi khi hàng xuất hiện / đổi bề ngang
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      setBox({
        width: el.clientWidth,
        cell: cssLengthPx(cs.getPropertyValue('--thumb-w'), 72),
        nav: cssLengthPx(cs.getPropertyValue('--thumb-nav-w'), 24),
        gap: parseFloat(cs.columnGap) || 0,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasStrip]);

  // Số ảnh hiện được: không có mũi tên nếu vừa hết, ngược lại trừ chỗ cho hai mũi tên
  const fitAll = box ? Math.max(1, Math.floor((box.width + box.gap) / (box.cell + box.gap))) : count;
  const overflow = count > fitAll;
  const visible =
    overflow && box
      ? Math.max(1, Math.floor((box.width - 2 * (box.nav + box.gap) + box.gap) / (box.cell + box.gap)))
      : count;
  // Dòng đầy (vừa khít hoặc phải ẩn bớt): các ô giãn đều cho hàng rộng bằng khung ảnh
  const full = !!box && (overflow || count === fitAll);
  const maxStart = Math.max(0, count - visible);
  let from = Math.min(Math.max(start, 0), maxStart);

  // Ảnh đang xem đổi: kéo hàng tới ảnh đó nếu nó đang nằm ngoài (điều chỉnh state ngay khi render)
  if (index !== prevIndex) {
    setPrevIndex(index);
    let next = from;
    if (index < from) next = index;
    else if (index >= from + visible) next = index - visible + 1;
    next = Math.min(Math.max(next, 0), maxStart);
    if (next !== start) setStart(next);
    from = next;
  }

  if (!hasStrip) return null;

  const slide = (dir: 1 | -1) => setStart(Math.min(Math.max(from + dir * visible, 0), maxStart));

  return (
    <div className="photo-thumbs-wrap">
      <div ref={strip} className="photo-thumbs" data-full={full}>
        {overflow && (
          <button
            type="button"
            onClick={() => slide(-1)}
            disabled={from === 0}
            aria-label="Trượt hàng ảnh mini sang trái"
            className="photo-thumbs-nav"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        {photos.slice(from, from + visible).map((p, k) => {
          const i = from + k;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onPick(i)}
              aria-label={`Xem ảnh ${i + 1}: ${p.alt}`}
              aria-current={i === index ? 'true' : undefined}
              className="photo-thumb"
            >
              <img src={p.src} alt="" loading="lazy" decoding="async" />
            </button>
          );
        })}
        {overflow && (
          <button
            type="button"
            onClick={() => slide(1)}
            disabled={from >= maxStart}
            aria-label="Trượt hàng ảnh mini sang phải"
            className="photo-thumbs-nav"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      {overflow && (
        <p className="photo-thumbs-count">
          {visible} ảnh / {count} ảnh
        </p>
      )}
    </div>
  );
}

/**
 * Cuộn chuột (hoặc vuốt hai ngón trên touchpad) trong phần tử để đổi ảnh.
 * Khi `active`, mọi cú cuộn trong phần tử chỉ dùng để đổi ảnh: trang không cuộn theo, kể cả ở ảnh đầu / cuối
 * (`onStep` tự quyết có đổi được hay không). Khi không `active` (ví dụ đang xem bản đồ), trang cuộn như thường.
 * Một cú cuộn chỉ đổi một ảnh (khoá ngắn sau mỗi lần đổi để touchpad không lướt qua nhiều ảnh).
 * Trả về callback ref để gắn vào phần tử.
 */
export function useWheelStep<T extends HTMLElement>(onStep: (dir: 1 | -1) => void, active: boolean) {
  const [el, setEl] = useState<T | null>(null);
  const latest = useRef({ onStep, active });
  useEffect(() => {
    latest.current = { onStep, active };
  });

  useEffect(() => {
    if (!el) return;
    let lockedUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (!latest.current.active) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 4) return;
      const now = performance.now();
      // Còn trong cú cuộn vừa đổi ảnh: bỏ qua, kéo dài khoá tới khi cú cuộn dừng hẳn
      if (now < lockedUntil) {
        lockedUntil = now + 250;
        return;
      }
      latest.current.onStep(delta > 0 ? 1 : -1);
      lockedUntil = now + 450;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [el]);

  return setEl;
}

/** Bước vòng tròn trong danh sách có `count` phần tử */
export function stepIndex(index: number, delta: number, count: number) {
  return (index + delta + count) % count;
}

export default PhotoNav;
