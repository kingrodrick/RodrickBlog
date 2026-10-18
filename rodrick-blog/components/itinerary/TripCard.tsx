import React from 'react';
import Link from 'next/link';
import { TripWithDetails } from '@/services/itinerary.service';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface TripCardProps {
  trip: TripWithDetails;
}

export function TripCard({ trip }: TripCardProps) {
  // Ưu tiên ảnh bìa trực tiếp từ cột cover_image của chuyến đi
  let coverUrl = trip.cover_image || '';

  let totalPhotos = 0;
  if (trip.timeline_events && trip.timeline_events.length > 0) {
    for (const event of trip.timeline_events) {
      if (event.images && event.images.length > 0) {
        totalPhotos += event.images.length;
        if (!coverUrl && event.images[0].cloudinary_url) {
          coverUrl = event.images[0].cloudinary_url;
        }
      }
    }
  }

  if (!coverUrl) {
    coverUrl =
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80';
  }

  coverUrl = optimizeCloudinaryUrl(coverUrl);

  const totalEvents = trip.timeline_events?.length || 0;

  // Format date range
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

  return (
    <article className="group bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-[#D0C9BD] transition-all flex flex-col justify-between">
      {/* Top Banner Image */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#F3F0EA]">
        <img
          src={coverUrl}
          alt={trip.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold backdrop-blur-xs ${statusBadge.color}`}>
            ● {statusBadge.label}
          </span>
          <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full">
            📍 {trip.cities}
          </span>
        </div>

        {/* Date Tag */}
        <div className="absolute bottom-3.5 left-3.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-md">
          🗓 {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <h3 className="font-serif text-2xl font-bold text-[#1C1B18] group-hover:text-[#B93829] transition-colors leading-snug">
            {trip.title}
          </h3>

          {trip.summary && (
            <p className="text-xs sm:text-sm text-[#57544E] leading-relaxed line-clamp-3">
              {trip.summary}
            </p>
          )}
        </div>

        {/* Metrics Bar & Link Button */}
        <div className="pt-4 border-t border-[#F0ECE4] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#78756E]">
            <span className="flex items-center gap-1.5">
              <span>⏱</span>
              <strong className="text-[#1C1B18]">{totalEvents}</strong> mốc lịch trình chi tiết
            </span>
            <span className="flex items-center gap-1.5">
              <span>📷</span>
              <strong className="text-[#1C1B18]">{totalPhotos}</strong> ảnh Sony A6400
            </span>
          </div>

          <Link
            href={`/trips/${trip.slug}`}
            className="w-full bg-[#FAF8F5] hover:bg-[#1C1B18] text-[#1C1B18] hover:text-white border border-[#E6E2DA] hover:border-[#1C1B18] text-xs font-mono uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-between transition-all"
          >
            <span className="font-semibold">Khám phá chi tiết lịch trình</span>
            <span className="text-base leading-none">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default TripCard;
