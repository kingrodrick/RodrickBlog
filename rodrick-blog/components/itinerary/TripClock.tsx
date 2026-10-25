'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TimelineEvent } from '@/types/database.type';
import {
  cityUtcOffset,
  eventStartMs,
  formatDateVN,
  formatDayMonth,
  splitTimeSlot,
} from '@/lib/tripFormat';

type ClockEvent = Pick<TimelineEvent, 'id' | 'trip_date' | 'time_slot' | 'location_name' | 'city'>;

interface TripClockProps {
  events: ClockEvent[];
  startDate: string;
  endDate: string;
  cities?: string;
  /** Đường dẫn trang chuyến đi; để trống khi đồng hồ nằm ngay trên trang đó */
  tripHref?: string;
  /** figure: con số lớn (trang chủ) · inline: một đoạn văn (đầu trang chuyến đi) */
  variant?: 'figure' | 'inline';
}

function clockIn(offset: number, now: number) {
  const d = new Date(now + offset * 3600000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * Đồng hồ chuyến đi: đếm ngược tới mốc đầu tiên, cho biết theo lịch lúc này
 * đang ở đâu khi chuyến đi diễn ra, và báo khi chuyến đi đã khép lại.
 */
export function TripClock({
  events,
  startDate,
  endDate,
  cities,
  tripHref = '',
  variant = 'inline',
}: TripClockProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, 30000);
    return () => {
      window.cancelAnimationFrame(first);
      window.clearInterval(id);
    };
  }, []);

  const timed = useMemo(
    () =>
      events
        .map((e) => ({ event: e, at: eventStartMs(e) }))
        .filter((x): x is { event: ClockEvent; at: number } => x.at !== null)
        .sort((a, b) => a.at - b.at),
    [events]
  );

  const japanOffset = cities && cityUtcOffset(cities) === 9 ? 9 : null;

  // Không có script, hoặc trước lần đo đầu tiên: ngày tháng tĩnh
  if (now === null) {
    return (
      <p className="text-body">
        Khởi hành ngày {formatDateVN(startDate)}, trở về ngày {formatDateVN(endDate)}.
      </p>
    );
  }

  const first = timed[0];
  const endParts = endDate.split('-').map(Number);
  const tripEnd = endParts.length === 3 ? Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 24 - 7) : null;
  const startAt = first?.at ?? eventStartMs({ trip_date: startDate, time_slot: '00:00', city: cities || '' });

  const tokyoLine = japanOffset ? (
    <span className="block text-small text-muted mt-3 tabular">
      Giờ Tokyo lúc này: {clockIn(japanOffset, now)}
    </span>
  ) : null;

  // Trước chuyến đi: đếm ngược
  if (startAt !== null && now < startAt) {
    const diff = startAt - now;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const big = days > 0 ? `${days}` : hours > 0 ? `${hours}` : `${minutes}`;
    const unit = days > 0 ? 'ngày' : hours > 0 ? 'giờ' : 'phút';
    const firstSlot = first ? splitTimeSlot(first.event.time_slot).start : '';
    const target = first ? (
      <>
        mốc đầu tiên: <strong className="font-semibold">{first.event.location_name}</strong>,{' '}
        {firstSlot} ngày {formatDayMonth(first.event.trip_date)}
        {first.event.city ? ` tại ${first.event.city}` : ''}.
      </>
    ) : (
      <>ngày khởi hành {formatDateVN(startDate)}.</>
    );

    if (variant === 'figure') {
      return (
        <div>
          <p className="text-display leading-[0.9] tracking-[-0.03em] tabular" aria-hidden="true">
            {big}
            <span className="text-head ml-3">{unit}</span>
          </p>
          <p className="mt-5 max-w-[34ch]">
            <span className="sr-only">
              Còn {big} {unit}{' '}
            </span>
            nữa đến {target}{' '}
            {days > 0 && (
              <span className="text-muted tabular">
                ({hours} giờ {minutes} phút lẻ)
              </span>
            )}
          </p>
          {tripHref && (
            <Link href={tripHref} className="text-link inline-block mt-4 text-small font-semibold">
              Xem lịch trình từng giờ
            </Link>
          )}
          {tokyoLine}
        </div>
      );
    }

    return (
      <p>
        Còn{' '}
        <strong className="font-semibold text-accent tabular">
          {big} {unit}
          {days > 0 ? ` ${hours} giờ` : ''}
        </strong>{' '}
        nữa đến {target}
        {tokyoLine}
      </p>
    );
  }

  // Sau chuyến đi
  if (tripEnd !== null && now >= tripEnd) {
    return (
      <p>
        Chuyến đi đã khép lại ngày {formatDateVN(endDate)}.{' '}
        {tripHref && (
          <Link href={tripHref} className="text-link font-semibold">
            Đọc lại lịch trình
          </Link>
        )}
      </p>
    );
  }

  // Đang diễn ra: mốc gần nhất đã bắt đầu
  const current = [...timed].reverse().find((x) => x.at <= now) ?? first;
  const localTime = current ? clockIn(cityUtcOffset(current.event.city), now) : '';
  return (
    <p>
      Theo lịch, lúc này ({localTime} giờ {current?.event.city}) Rodrick đang ở{' '}
      {current ? (
        <Link href={`${tripHref}#moc-${current.event.id}`} className="text-link font-semibold">
          {current.event.location_name}
        </Link>
      ) : (
        'trên đường'
      )}
      .
      {tokyoLine}
    </p>
  );
}

export default TripClock;
