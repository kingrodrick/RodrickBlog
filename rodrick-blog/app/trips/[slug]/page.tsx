import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ItineraryService } from '@/services/itinerary.service';
import { ItinerarySinglePageView } from '@/components/itinerary/ItinerarySinglePageView';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

export const instant = false;

interface TripDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { slug } = await params;
  const trip = await ItineraryService.getTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const events = await ItineraryService.getTimelineWithImages(trip.id);

  // Format date
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

  const totalPhotos = events.reduce((sum, e) => sum + (e.images?.length || 0), 0);

  const coverUrl = trip.cover_image
    ? optimizeCloudinaryUrl(trip.cover_image)
    : null;

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18]">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#78756E]">
          <Link href="/" className="hover:text-[#B93829] transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/#trips" className="hover:text-[#B93829] transition-colors">
            Hành trình
          </Link>
          <span>/</span>
          <span className="text-[#1C1B18] font-semibold truncate max-w-xs">
            {trip.title}
          </span>
        </nav>

        {/* Trip Hero Header with Cover Image */}
        <header className="relative bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-xs">
          {coverUrl && (
            <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#F3F0EA]">
              <img
                src={coverUrl}
                alt={trip.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

              {/* Title & Badges on top of cover */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold backdrop-blur-xs ${statusBadge.color}`}>
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
          <div className="p-6 sm:p-8 space-y-4 bg-white">
            {!coverUrl && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border font-semibold ${statusBadge.color}`}>
                    ● {statusBadge.label}
                  </span>
                  <span className="bg-white border border-[#E2DDD5] text-[#57544E] text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full">
                    📍 {trip.cities}
                  </span>
                  <span className="bg-white border border-[#E2DDD5] text-[#78756E] text-[10px] font-mono px-2.5 py-1 rounded-full">
                    🗓 {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                  </span>
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
            <div className="pt-3 border-t border-[#F0ECE4] flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#78756E]">
              <span className="flex items-center gap-1.5">
                <span>⏱</span>
                <strong className="text-[#1C1B18]">{events.length}</strong> mốc thời gian chi tiết
              </span>
              <span className="flex items-center gap-1.5">
                <span>📷</span>
                <strong className="text-[#1C1B18]">{totalPhotos}</strong> bức ảnh từ Sony A6400
              </span>
              <span className="flex items-center gap-1.5">
                <span>⛩️</span>
                {trip.cities} (Tháng 12/2026)
              </span>
            </div>
          </div>
        </header>

        {/* Detailed Timeline View */}
        <ItinerarySinglePageView events={events} />
      </main>
    </div>
  );
}
