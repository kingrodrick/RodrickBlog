'use client';

import React from 'react';

interface DayFilterTabsProps {
  days: number[];
  selectedDay: number | 'all';
  onSelectDay: (day: number | 'all') => void;
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  totalFilteredCount: number;
  datesByDay?: Record<number, string>;
}

function chipClass(isActive: boolean) {
  return `min-h-10 px-4 text-small whitespace-nowrap cursor-pointer transition-colors duration-200 active:scale-[0.97] ${
    isActive ? 'bg-ink text-paper font-semibold' : 'bg-paper hover:bg-surface'
  }`;
}

export function DayFilterTabs({
  days,
  selectedDay,
  onSelectDay,
  cities,
  selectedCity,
  onSelectCity,
  totalFilteredCount,
  datesByDay = {},
}: DayFilterTabsProps) {
  // Nhãn ngày kèm ngày tháng nếu có: 'Ngày 1 (11/12)'
  const getDayLabel = (day: number) => {
    const rawDate = datesByDay[day];
    if (rawDate) {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        return `Ngày ${day} (${parts[2]}/${parts[1]})`;
      }
    }
    return `Ngày ${day}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-small text-muted" aria-live="polite">
        Đang hiển thị <span className="font-semibold text-ink tabular">{totalFilteredCount}</span> mốc
        hành trình.
      </p>

      <div role="group" aria-label="Lọc theo ngày" className="flex flex-wrap items-center gap-2">
        <span className="text-small text-muted shrink-0 w-24">Ngày</span>
        <button
          type="button"
          onClick={() => onSelectDay('all')}
          aria-pressed={selectedDay === 'all'}
          className={chipClass(selectedDay === 'all')}
        >
          Tất cả các ngày
        </button>
        {days.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(day)}
            aria-pressed={selectedDay === day}
            className={chipClass(selectedDay === day)}
          >
            {getDayLabel(day)}
          </button>
        ))}
      </div>

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
    </div>
  );
}

export default DayFilterTabs;
