'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trip } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { useAuth } from '@/components/auth/AuthContext';
import { EditTripModal } from '@/components/editor/EditTripModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';

interface TripHeroHeaderProps {
  initialTrip: Trip;
  eventsCount: number;
  totalPhotos: number;
}

export function TripHeroHeader({
  initialTrip,
  eventsCount,
  totalPhotos,
}: TripHeroHeaderProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const statusBadge =
    trip.status === 'PLANNING'
      ? { label: 'Đang Lên Kế Hoạch', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
      : trip.status === 'ONGOING'
      ? { label: 'Đang Diễn Ra', color: 'bg-rose-50 text-[#B93829] border-rose-200' }
      : { label: 'Đã Hoàn Thành', color: 'bg-stone-100 text-stone-700 border-stone-200' };

  const coverUrl = trip.cover_image ? optimizeCloudinaryUrl(trip.cover_image) : null;

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
      <header className="relative bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-xs">
        {coverUrl && (
          <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#F3F0EA]">
            <img
              src={coverUrl}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

            {/* Top Right Edit Button for Logged-In Editor */}
            {isLoggedIn && (
              <div className="absolute top-4 right-4 z-20">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-white/90 hover:bg-[#B93829] text-stone-900 hover:text-white backdrop-blur-md px-3.5 py-2 rounded-xl font-mono text-xs font-semibold shadow-lg border border-white/40 flex items-center gap-1.5 transition-all cursor-pointer group"
                >
                  <span className="group-hover:scale-110 transition-transform">✏️</span>
                  <span>Chỉnh sửa chuyến đi</span>
                </button>
              </div>
            )}

            {/* Title & Badges on top of cover */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold backdrop-blur-xs ${statusBadge.color}`}
                >
                  ● {statusBadge.label}
                </span>
                <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full">
                  📍 {trip.cities}
                </span>
                <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-full">
                  🗓 {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-sm leading-[1.2]">
                {trip.title}
              </h1>
            </div>
          </div>
        )}

        {/* Details below cover */}
        <div className="p-6 sm:p-8 space-y-4 bg-white relative">
          {!coverUrl && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold ${statusBadge.color}`}
                  >
                    ● {statusBadge.label}
                  </span>
                  <span className="bg-white border border-[#E2DDD5] text-[#57544E] text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full">
                    📍 {trip.cities}
                  </span>
                  <span className="bg-white border border-[#E2DDD5] text-[#78756E] text-[10px] font-mono px-2.5 py-1 rounded-full">
                    🗓 {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                  </span>
                </div>

                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-[#FAF8F5] hover:bg-[#B93829] text-stone-800 hover:text-white px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold border border-[#E6E2DA] hover:border-[#B93829] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>✏️</span>
                    <span>Chỉnh sửa chuyến đi</span>
                  </button>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18]">
                {trip.title}
              </h1>
            </div>
          )}

          {trip.summary && (
            <p className="font-serif italic text-base sm:text-lg text-[#57544E] max-w-3xl leading-relaxed">
              {trip.summary}
            </p>
          )}

          {/* Quick stats on the hero */}
          <div className="pt-3 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#78756E]">
              <span className="flex items-center gap-1.5">
                <span>⏱</span>
                <strong className="text-[#1C1B18]">{eventsCount}</strong> mốc thời gian chi tiết
              </span>
              <span className="flex items-center gap-1.5">
                <span>📷</span>
                <strong className="text-[#1C1B18]">{totalPhotos}</strong> bức ảnh từ Sony A6400
              </span>
              <span className="flex items-center gap-1.5">
                <span>⛩️</span>
                {trip.cities}
              </span>
            </div>

            {/* If coverUrl is present, also show a subtle edit button in footer for convenience */}
            {coverUrl && isLoggedIn && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-mono text-stone-600 hover:text-[#B93829] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>✏️ Sửa thông tin chuyến đi</span>
              </button>
            )}
          </div>
        </div>
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
