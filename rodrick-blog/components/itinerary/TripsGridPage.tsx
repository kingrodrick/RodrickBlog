'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { TripWithDetails } from '@/services/itinerary.service';
import { Trip } from '@/types/database.type';
import { useAuth } from '@/components/auth/AuthContext';
import { CreateTripModal } from '@/components/editor/CreateTripModal';
import { EditTripModal } from '@/components/editor/EditTripModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';
import { TicketPerf } from '@/components/ui/Ticket';
import {
  formatDateRangeVN,
  formatDuration,
  pickNextTrip,
  tripCoverUrl,
  tripDurationDays,
  tripPhotoCount,
} from '@/lib/tripFormat';

interface TripsGridPageProps {
  initialTrips: TripWithDetails[];
}

type StatusFilter = 'all' | 'PLANNING' | 'ONGOING' | 'COMPLETED';

const STATUS_ORDER: Exclude<StatusFilter, 'all'>[] = ['ONGOING', 'PLANNING', 'COMPLETED'];

function statusLabel(status?: string) {
  if (status === 'PLANNING') return 'Đang lên kế hoạch';
  if (status === 'ONGOING') return 'Đang diễn ra';
  return 'Đã hoàn thành';
}

/** Ô vuông màu theo trạng thái: đỏ đang đi, vàng giấy đang lên kế hoạch, mực đã xong */
function StatusMark({ status }: { status?: string }) {
  const color =
    status === 'ONGOING' ? 'bg-accent' : status === 'PLANNING' ? 'bg-(--note-ref-tag)' : 'bg-ink';
  return <span aria-hidden="true" className={`inline-block w-2.5 h-2.5 shrink-0 ${color}`} />;
}

function normalizeStatus(status?: string): Exclude<StatusFilter, 'all'> {
  return status === 'PLANNING' || status === 'ONGOING' ? status : 'COMPLETED';
}

export function TripsGridPage({ initialTrips }: TripsGridPageProps) {
  const { isLoggedIn } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>(initialTrips);
  const [editingTrip, setEditingTrip] = useState<TripWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const handleTripUpdated = (updated: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    setEditingTrip(null);
  };

  const handleTripDeleted = (deletedId: number) => {
    setTrips((prev) => prev.filter((t) => t.id !== deletedId));
    setEditingTrip(null);
  };

  const totals = useMemo(
    () => ({
      stops: trips.reduce((sum, t) => sum + (t.timeline_events?.length || 0), 0),
      photos: trips.reduce((sum, t) => sum + tripPhotoCount(t), 0),
    }),
    [trips]
  );

  // Chuyến nổi bật: đang diễn ra, nếu không thì chuyến sắp tới gần nhất
  const featured = useMemo(
    () => trips.find((t) => t.status === 'ONGOING') || pickNextTrip(trips) || null,
    [trips]
  );

  const presentStatuses = STATUS_ORDER.filter((s) => trips.some((t) => normalizeStatus(t.status) === s));
  const filtered = filter === 'all' ? trips : trips.filter((t) => normalizeStatus(t.status) === filter);

  return (
    <>
      <nav aria-label="Vị trí trang" className="frame pt-2 pb-4 text-small">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="text-link text-muted">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted">
            /
          </li>
          <li aria-current="page" className="font-semibold">
            Hành trình
          </li>
        </ol>
      </nav>

      {/* Đầu trang: tiêu đề lớn bên trái, số liệu bên phải */}
      <header className="frame mt-6 lg:mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8 lg:items-end">
        <div className="lg:col-span-7">
          <h1 data-reveal className="text-display leading-[0.92] tracking-[-0.035em]">
            Tất cả hành trình
          </h1>
          <p
            data-reveal
            style={{ '--d': '80ms' } as React.CSSProperties}
            className="mt-8 text-lead leading-[1.35] max-w-[44ch]"
          >
            Kế hoạch tự túc từng ngày, từng giờ, cùng ảnh chụp thực tế bằng Sony A6400.
          </p>
        </div>

        <div data-reveal style={{ '--d': '140ms' } as React.CSSProperties} className="lg:col-start-9 lg:col-span-4 space-y-6">
          <dl className="grid grid-cols-3 gap-4">
            {[
              { label: 'chuyến đi', value: trips.length },
              { label: 'mốc lịch trình', value: totals.stops },
              { label: 'bức ảnh', value: totals.photos },
            ].map((s) => (
              <div key={s.label}>
                <dd className="text-head leading-none tabular">{s.value}</dd>
                <dt className="mt-2 text-small text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
          {isLoggedIn && (
            <button type="button" onClick={() => setIsCreateModalOpen(true)} className="btn w-full sm:w-auto">
              + Thêm chuyến đi mới
            </button>
          )}
        </div>
      </header>

      {trips.length === 0 ? (
        <section className="frame mt-16">
          <div className="bg-paper p-10 sm:p-14 max-w-2xl space-y-4">
            <h2 className="text-head">Chưa có chuyến đi nào</h2>
            <p className="text-muted">
              {isLoggedIn
                ? 'Bấm "Thêm chuyến đi mới" để tạo hành trình đầu tiên.'
                : 'Các hành trình mới sẽ được cập nhật tại đây.'}
            </p>
            {isLoggedIn && (
              <button type="button" onClick={() => setIsCreateModalOpen(true)} className="btn">
                + Thêm chuyến đi ngay
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Chuyến nổi bật: tấm vé lớn như trang chi tiết */}
          {featured && <FeaturedTrip trip={featured} onEdit={isLoggedIn ? () => setEditingTrip(featured) : undefined} />}

          {/* Mục lục mọi chuyến đi */}
          <section aria-labelledby="all-trips-title" className="frame mt-24 lg:mt-36">
            <div className="flex flex-wrap items-end justify-between gap-6 pb-8">
              <h2 id="all-trips-title" className="text-head">
                Mọi chuyến đi
              </h2>
              {presentStatuses.length > 1 && (
                <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
                  {(['all', ...presentStatuses] as StatusFilter[]).map((s) => {
                    const active = filter === s;
                    const count = s === 'all' ? trips.length : trips.filter((t) => normalizeStatus(t.status) === s).length;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilter(s)}
                        aria-pressed={active}
                        className={`min-h-10 px-4 inline-flex items-center gap-2 text-small cursor-pointer transition-colors duration-200 ${
                          active ? 'bg-ink text-paper font-semibold' : 'bg-paper hover:bg-surface'
                        }`}
                      >
                        {s !== 'all' && <StatusMark status={s} />}
                        {s === 'all' ? 'Tất cả' : statusLabel(s)}
                        <span className="tabular opacity-60">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <ol className="space-y-2">
              {filtered.map((trip, i) => (
                <TripRow
                  key={trip.id}
                  trip={trip}
                  index={i}
                  onEdit={isLoggedIn ? () => setEditingTrip(trip) : undefined}
                />
              ))}
            </ol>
          </section>
        </>
      )}

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          isOpen={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          onTripUpdated={handleTripUpdated}
          onTripDeleted={handleTripDeleted}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />
      )}

      <SqlInstructionModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
    </>
  );
}

/** Tấm vé lớn của chuyến đang diễn ra hoặc sắp tới: ảnh bìa bên trái, vé và cuống vé bên phải */
function FeaturedTrip({ trip, onEdit }: { trip: TripWithDetails; onEdit?: () => void }) {
  const days = tripDurationDays(trip.start_date, trip.end_date);
  const stops = trip.timeline_events?.length || 0;
  const photos = tripPhotoCount(trip);
  const cover = tripCoverUrl(trip);

  return (
    <section aria-labelledby="featured-trip-title" className="frame mt-16 lg:mt-24 grid gap-3 lg:grid-cols-12">
      <Link
        href={`/trips/${trip.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        data-reveal
        className="group relative block overflow-hidden bg-surface h-[42svh] lg:h-auto lg:min-h-[32rem] lg:col-span-7"
      >
        {cover && (
          <img
            src={cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.03]"
          />
        )}
      </Link>

      <div
        data-reveal
        style={{ '--d': '120ms' } as React.CSSProperties}
        className="relative z-10 -mt-6 lg:mt-0 mx-3 lg:mx-0 lg:col-span-5 flex flex-col"
      >
        <div className="ticket-main flex-1 flex flex-col p-6 pb-10 sm:p-10 sm:pb-12">
          <h2 id="featured-trip-title" className="text-head leading-[0.95] tracking-[-0.03em]">
            <Link href={`/trips/${trip.slug}`} className="hover:text-accent transition-colors duration-200">
              {trip.title}
            </Link>
          </h2>
          <p className="mt-4 flex items-center gap-2 text-small font-semibold">
            <StatusMark status={trip.status} />
            {trip.status === 'ONGOING'
              ? 'Đang diễn ra'
              : trip.status === 'PLANNING'
                ? 'Chuyến đi sắp tới'
                : 'Chuyến đi gần đây'}
          </p>
          {trip.summary && <p className="mt-6 max-w-[42ch] line-clamp-4">{trip.summary}</p>}
          <div className="mt-auto pt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={`/trips/${trip.slug}`} className="btn">
              Xem lịch trình từng giờ
            </Link>
            {onEdit && (
              <button type="button" onClick={onEdit} className="text-link text-small font-semibold cursor-pointer">
                Sửa chuyến đi
              </button>
            )}
          </div>
        </div>

        <div className="ticket-stub px-6 pt-8 pb-10 sm:px-10">
          <TicketPerf />
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-small">
            <div>
              <dt className="text-muted">Ngày đi</dt>
              <dd className="font-semibold tabular">{formatDateRangeVN(trip.start_date, trip.end_date)}</dd>
            </div>
            <div>
              <dt className="text-muted">Thành phố</dt>
              <dd className="font-semibold">{trip.cities}</dd>
            </div>
            <div>
              <dt className="text-muted">Độ dài</dt>
              <dd className="font-semibold">{formatDuration(days) || 'Chưa xác định'}</dd>
            </div>
            <div>
              <dt className="text-muted">Mốc thời gian</dt>
              <dd className="font-semibold tabular">{stops} mốc</dd>
            </div>
            <div>
              <dt className="text-muted">Ảnh</dt>
              <dd className="font-semibold tabular">{photos} bức</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

/** Một dòng trong mục lục: ảnh bìa, tên và tóm tắt, thông số; cả dòng là liên kết */
function TripRow({ trip, index, onEdit }: { trip: TripWithDetails; index: number; onEdit?: () => void }) {
  const days = tripDurationDays(trip.start_date, trip.end_date);
  const stops = trip.timeline_events?.length || 0;
  const photos = tripPhotoCount(trip);
  const cover = tripCoverUrl(trip);

  return (
    <li
      data-reveal
      style={{ '--d': `${Math.min(index, 6) * 60}ms` } as React.CSSProperties}
      className="relative"
    >
      <Link
        href={`/trips/${trip.slug}`}
        className="group grid gap-5 sm:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)_16rem] lg:gap-8 p-4 sm:p-5 lg:items-center transition-colors duration-300 hover:bg-paper"
      >
        <span className="block aspect-4/3 overflow-hidden bg-surface">
          {cover && (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.04]"
            />
          )}
        </span>

        <span className="block min-w-0">
          <span className="flex items-center gap-2 text-small text-muted">
            <StatusMark status={trip.status} />
            {statusLabel(trip.status)}
          </span>
          <span className="mt-2 block text-lead leading-tight transition-colors duration-200 group-hover:text-accent">
            {trip.title}
          </span>
          {trip.summary && <span className="mt-3 block line-clamp-2 max-w-[60ch]">{trip.summary}</span>}
        </span>

        <span className="block text-small sm:col-start-2 lg:col-start-auto">
          <span className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1">
            <span className="text-muted">Ngày đi</span>
            <span className="font-semibold tabular">{formatDateRangeVN(trip.start_date, trip.end_date)}</span>
            <span className="text-muted">Thành phố</span>
            <span className="font-semibold">{trip.cities}</span>
            {days > 0 && (
              <>
                <span className="text-muted">Độ dài</span>
                <span className="font-semibold">{formatDuration(days)}</span>
              </>
            )}
            <span className="text-muted">Nội dung</span>
            <span className="font-semibold tabular">
              {stops} mốc · {photos} ảnh
            </span>
          </span>
          <span className="mt-4 inline-block font-semibold underline underline-offset-4 decoration-1 group-hover:text-accent">
            Xem lịch trình →
          </span>
        </span>
      </Link>

      {/* Nút sửa nằm ngoài liên kết để không lồng nút trong thẻ a */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-6 right-0 sm:right-4 min-h-9 px-3 text-small font-semibold bg-ground hover:bg-ink hover:text-paper cursor-pointer transition-colors duration-200"
        >
          Sửa
        </button>
      )}
    </li>
  );
}

export default TripsGridPage;
