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
  // Format day label with date if available
  const getDayLabel = (day: number) => {
    const rawDate = datesByDay[day];
    if (rawDate) {
      // If rawDate is '2026-12-12', extract 12/12
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        return `NGÀY ${day} (${parts[2]}/${parts[1]})`;
      }
    }
    return `NGÀY ${day}`;
  };

  return (
    <div className="space-y-4">
      {/* City Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C8881] mr-1">
            LỌC THEO THÀNH PHỐ:
          </span>
          <button
            type="button"
            onClick={() => onSelectCity('all')}
            className={`px-3 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
              selectedCity === 'all'
                ? 'bg-[#1C1B18] text-white border-[#1C1B18]'
                : 'bg-white text-[#57544E] border-[#E6E2DA] hover:border-[#1C1B18]'
            }`}
          >
            Tất cả thành phố
          </button>
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                selectedCity === city
                  ? 'bg-[#B93829] text-white border-[#B93829]'
                  : 'bg-white text-[#57544E] border-[#E6E2DA] hover:border-[#B93829]'
              }`}
            >
              📍 {city}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-[#8C8881] whitespace-nowrap">
          Đang hiển thị: <span className="font-semibold text-[#1C1B18]">{totalFilteredCount}</span> mốc hành trình
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6E2DA] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => onSelectDay('all')}
          className={`px-3.5 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer whitespace-nowrap ${
            selectedDay === 'all'
              ? 'bg-[#1C1B18] text-white font-semibold shadow-xs'
              : 'bg-white border border-[#E6E2DA] text-[#57544E] hover:bg-[#F3F0EA]'
          }`}
        >
          TẤT CẢ CÁC NGÀY
        </button>
        {days.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay(day)}
            className={`px-3.5 py-1.5 text-xs font-mono uppercase rounded-md transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === day
                ? 'bg-[#B93829] text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E6E2DA] text-[#57544E] hover:bg-[#F3F0EA]'
            }`}
          >
            {getDayLabel(day)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DayFilterTabs;
