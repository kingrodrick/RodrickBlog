'use client';

import React, { useEffect, useRef } from 'react';

function chipClass(isActive: boolean) {
  return `min-h-10 px-4 text-small whitespace-nowrap cursor-pointer transition-colors duration-200 active:scale-[0.97] ${
    isActive ? 'bg-ink text-paper font-semibold' : 'bg-paper hover:bg-surface'
  }`;
}

/** Nhãn ngày kèm ngày tháng nếu có: 'Ngày 1 (11/12)' */
function dayLabel(day: number, datesByDay: Record<number, string>) {
  const parts = datesByDay[day]?.split('-');
  return parts && parts.length === 3 ? `Ngày ${day} (${parts[2]}/${parts[1]})` : `Ngày ${day}`;
}

/** Dòng đếm số mốc đang hiển thị */
export function FilterCount({ count }: { count: number }) {
  return (
    <p className="text-small text-muted" aria-live="polite">
      Đang hiển thị <span className="font-semibold text-ink tabular">{count}</span> mốc hành trình.
    </p>
  );
}

interface DayBarProps {
  days: number[];
  /** Bấm một ngày: cuộn tới đầu ngày đó (không lọc danh sách) */
  onGoToDay: (day: number) => void;
  datesByDay?: Record<number, string>;
  /** Ngày của mốc đang đọc: chip của ngày này được tô đậm */
  currentDay?: number | null;
}

/**
 * Thanh điều hướng theo ngày, dính dưới thanh menu khi cuộn: luôn thấy mình đang ở ngày nào
 * (chip tô đậm, tự đổi khi cuộn) và bấm để nhảy tới ngày khác mà vẫn giữ đủ danh sách.
 * Một dòng, nhiều ngày thì cuộn ngang; chip của ngày đang đọc tự được kéo vào tầm nhìn.
 * Đặt trực tiếp trong section dài của lịch trình để nó dính suốt cả danh sách.
 */
export function DayBar({ days, onGoToDay, datesByDay = {}, currentDay }: DayBarProps) {
  const scroller = useRef<HTMLElement>(null);
  const marked = currentDay ?? null;

  // Đo bề rộng thanh cuộn dọc của trang (Windows ~15px, macOS 0) cho nền tràn hết bề ngang của thanh:
  // 100vw tính cả thanh cuộn, không trừ đi thì nền lấn ra ngoài và sinh thanh cuộn ngang
  useEffect(() => {
    const root = document.documentElement;
    const update = () => root.style.setProperty('--scrollbar-w', `${window.innerWidth - root.clientWidth}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Kéo chip đang đánh dấu vào tầm nhìn (chỉ cuộn ngang thanh, không cuộn trang)
  useEffect(() => {
    const el = scroller.current;
    const chip = el?.querySelector<HTMLElement>(`[data-day="${marked}"]`);
    if (!el || !chip) return;
    const left = chip.offsetLeft;
    if (left < el.scrollLeft || left + chip.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: left - 16, behavior: 'smooth' });
    }
  }, [marked]);

  return (
    <div className="day-bar">
      <nav ref={scroller} aria-label="Đi tới ngày" className="day-bar-scroller">
        <span className="text-small text-muted shrink-0 w-24">Ngày</span>
        {days.map((day) => {
          const isCurrent = currentDay === day;
          return (
            <button
              key={day}
              type="button"
              data-day={day}
              onClick={() => onGoToDay(day)}
              aria-current={isCurrent ? 'step' : undefined}
              title={isCurrent ? 'Ngày đang đọc' : `Đi tới ngày ${day}`}
              // Ngày đang đọc chỉ đánh dấu bằng vạch đỏ dưới chân (CSS .day-chip[aria-current]), giữ nền giấy
              className={`day-chip ${chipClass(false)}`}
            >
              {dayLabel(day, datesByDay)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface CityChipsProps {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

/** Hàng lọc theo thành phố */
export function CityChips({ cities, selectedCity, onSelectCity }: CityChipsProps) {
  return (
    <div role="group" aria-label="Lọc theo thành phố" className="flex flex-wrap items-center gap-2">
      <span className="text-small text-muted shrink-0 w-24">Thành phố</span>
      <button
        type="button"
        onClick={() => onSelectCity('all')}
        aria-pressed={selectedCity === 'all'}
        className={chipClass(selectedCity === 'all')}
      >
        Tất cả thành phố
      </button>
      {cities.map((city) => (
        <button
          key={city}
          type="button"
          onClick={() => onSelectCity(city)}
          aria-pressed={selectedCity === city}
          className={chipClass(selectedCity === city)}
        >
          {city}
        </button>
      ))}
    </div>
  );
}
