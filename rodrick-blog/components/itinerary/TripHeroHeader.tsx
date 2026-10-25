'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trip, TimelineEvent } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { useAuth } from '@/components/auth/AuthContext';
import { EditTripModal } from '@/components/editor/EditTripModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';
import { TripClock } from './TripClock';
import { TicketPerf } from '@/components/ui/Ticket';
import { formatDateRangeVN, formatDuration, tripDurationDays } from '@/lib/tripFormat';

interface TripHeroHeaderProps {
  initialTrip: Trip;
  eventsCount: number;
  totalPhotos: number;
  events?: TimelineEvent[];
}

function statusLabel(status?: string) {
  if (status === 'PLANNING') return 'Đang lên kế hoạch';
  if (status === 'ONGOING') return 'Đang diễn ra';
  return 'Đã hoàn thành';
}

export function TripHeroHeader({
  initialTrip,
  eventsCount,
  totalPhotos,
  events = [],
}: TripHeroHeaderProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Ảnh bìa; nếu chuyến đi chưa có thì lấy ảnh đầu tiên trên timeline
  const firstEventImage = events.find((e) => e.images?.length)?.images?.[0]?.cloudinary_url;
  const coverSource = trip.cover_image || firstEventImage || null;
  const coverUrl = coverSource ? optimizeCloudinaryUrl(coverSource) : null;

  const dayCount = new Set(events.map((e) => e.day_number)).size;
  const duration = formatDuration(tripDurationDays(trip.start_date, trip.end_date, dayCount));

  const handleTripUpdated = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
    if (updatedTrip.slug !== initialTrip.slug) {
      router.push(`/trips/${updatedTrip.slug}`);
    } else {
      router.refresh();
    }
  };

  const handleTripDeleted = () => {
    router.push('/trips');
  };

  return (
    <>
      <header className="frame grid gap-3 lg:grid-cols-2 lg:min-h-[min(calc(100svh-var(--bar-h)-3.5rem),52rem)]">
        {/* Tấm vé của chuyến đi: phần chính và cuống vé (thông số, đồng hồ) */}
        <div className="relative z-10 min-w-0 order-2 lg:order-1 -mt-6 lg:mt-0 mx-3 lg:mx-0 flex flex-col">
          <div className="ticket-main flex-1 flex flex-col justify-center p-6 pb-10 sm:p-10 sm:pb-12 xl:p-14 xl:pb-14">
            <div>
              <h1
                data-reveal
                className="text-head leading-[0.95] tracking-[-0.03em]"
              >
                {trip.title}
              </h1>
              {trip.summary && (
                <p
                  data-reveal
                  style={{ '--d': '90ms' } as React.CSSProperties}
                  className="mt-8 lg:mt-10 text-lead leading-[1.35] max-w-[36ch]"
                >
                  {trip.summary}
                </p>
              )}
              <div
                data-reveal
                style={{ '--d': '170ms' } as React.CSSProperties}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                <a href="#itinerary" className="btn">
                  Xem lịch trình từng giờ
                </a>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-link text-small font-semibold cursor-pointer"
                  >
                    Chỉnh sửa chuyến đi
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="ticket-stub px-6 pt-10 pb-12 sm:px-10 xl:px-14">
            <TicketPerf />
            <div data-reveal style={{ '--d': '240ms' } as React.CSSProperties} className="space-y-6">
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
                  <dd className="font-semibold">{duration || 'Chưa xác định'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Trạng thái</dt>
                  <dd className="font-semibold">{statusLabel(trip.status)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Mốc thời gian</dt>
                  <dd className="font-semibold tabular">{eventsCount} mốc chi tiết</dd>
                </div>
                <div>
                  <dt className="text-muted">Ảnh</dt>
                  <dd className="font-semibold tabular">{totalPhotos} bức ảnh</dd>
                </div>
              </dl>

              <div className="bg-ground p-5">
                <TripClock
                  events={events}
                  startDate={trip.start_date}
                  endDate={trip.end_date}
                  cities={trip.cities}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ảnh bìa; khi chưa có ảnh thì là một mảng màu nhấn mang tên thành phố */}
        <figure className="order-1 lg:order-2 relative h-[48svh] lg:h-auto overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={trip.title}
              className="drift absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-accent text-accent-ink flex items-end p-8">
              <p className="text-head">{trip.cities}</p>
            </div>
          )}
        </figure>
      </header>

      {/* Edit Trip Modal */}
      <EditTripModal
        trip={trip}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTripUpdated={handleTripUpdated}
        onTripDeleted={handleTripDeleted}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* SQL Instruction Modal */}
      <SqlInstructionModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </>
  );
}

export default TripHeroHeader;
