'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TripWithDetails } from '@/services/itinerary.service';
import { PhotoStack } from '@/components/ui/PhotoStack';
import {
  formatDateRangeVN,
  formatDuration,
  tripCoverUrl,
  tripDurationDays,
  tripPhotoCount,
} from '@/lib/tripFormat';

interface TripListSectionProps {
  trips: TripWithDetails[];
}

function statusLabel(status?: string) {
  if (status === 'PLANNING') return 'Đang lên kế hoạch';
  if (status === 'ONGOING') return 'Đang diễn ra';
  return 'Đã hoàn thành';
}

export function TripListSection({ trips }: TripListSectionProps) {
  const displayedTrips = trips.slice(0, 4);
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Dòng nằm giữa màn hình khi cuộn trở thành dòng đang chọn
  useEffect(() => {
    const rows = rowRefs.current.filter(Boolean) as HTMLLIElement[];
    if (rows.length < 2 || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        });
      },
      { rootMargin: '-48% 0px -48% 0px' }
    );
    rows.forEach((row) => io.observe(row));
    return () => io.disconnect();
  }, [displayedTrips.length]);

  const photos = displayedTrips.map((trip) => ({
    key: trip.id,
    src: tripCoverUrl(trip),
    alt: trip.title,
  }));

  return (
    <section
      id="trips"
      aria-labelledby="trips-title"
      className="scroll-mt-20 frame mt-40 lg:mt-56 grid gap-10 lg:grid-cols-12 lg:gap-8"
    >
      {displayedTrips.length === 0 ? (
        <div className="lg:col-span-12 bg-paper p-10 space-y-3">
          <h2 id="trips-title" className="text-head">
            Hành trình đã lên lịch
          </h2>
          <p>Chưa có chuyến đi nào trong cơ sở dữ liệu.</p>
          <p className="text-small text-muted">
            Vui lòng thêm chuyến đi mới vào bảng `trips` trên Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Ảnh dính: đổi theo chuyến đi đang chọn */}
          <figure className="sticky top-[var(--bar-h)] z-10 lg:z-auto lg:top-[12vh] self-start lg:col-span-5 bg-pattern pb-3 lg:pb-0">
            <PhotoStack
              photos={photos}
              active={active}
              fast
              className="aspect-[4/3] max-h-[38svh] lg:max-h-none lg:aspect-[4/5] w-full"
            />
            <figcaption className="hidden lg:block mt-4 text-small text-muted">
              {displayedTrips[active]?.title}, {displayedTrips[active]?.cities}
            </figcaption>
          </figure>

          <div className="min-w-0 lg:col-start-7 lg:col-span-6">
            <h2 id="trips-title" data-reveal className="text-head max-w-[12ch]">
              Hành trình đã lên lịch
            </h2>

            <ul className="mt-12 space-y-2">
              {displayedTrips.map((trip, i) => {
                const isActive = i === active;
                const days = tripDurationDays(trip.start_date, trip.end_date);
                const stops = trip.timeline_events?.length || 0;
                const shots = tripPhotoCount(trip);
                return (
                  <li
                    key={trip.id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    data-index={i}
                    data-reveal
                    style={{ '--d': `${80 + i * 70}ms` } as React.CSSProperties}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className={`p-5 sm:p-6 transition-colors duration-300 ${
                      isActive ? 'bg-paper' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
                      <h3
                        className={`text-lead leading-tight transition-colors duration-300 ${
                          isActive ? 'text-ink' : 'text-muted'
                        }`}
                      >
                        <Link href={`/trips/${trip.slug}`} className="hover:text-accent transition-colors duration-200">
                          {trip.title}
                        </Link>
                      </h3>
                      <span className="text-small tabular text-muted shrink-0">
                        {formatDateRangeVN(trip.start_date, trip.end_date)}
                      </span>
                    </div>

                    <div
                      className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out)] ${
                        isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div
                        className={`overflow-hidden transition-[visibility] duration-500 ${
                          isActive ? 'visible' : 'invisible'
                        }`}
                      >
                        {trip.summary && <p className="mt-4 max-w-[52ch]">{trip.summary}</p>}
                        <p className="mt-3 text-small text-muted">
                          {statusLabel(trip.status)}. {trip.cities}
                          {days > 0 ? `, ${formatDuration(days)}` : ''}. {stops} mốc lịch trình chi
                          tiết, {shots} ảnh.
                        </p>
                        <Link
                          href={`/trips/${trip.slug}`}
                          className="btn btn-ink mt-6"
                        >
                          Khám phá chi tiết lịch trình
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-10 text-small">
              <Link href="/trips" className="text-link font-semibold">
                Xem tất cả {trips.length} chuyến đi
              </Link>
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export default TripListSection;
