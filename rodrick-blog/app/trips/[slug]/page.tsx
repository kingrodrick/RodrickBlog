import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ItineraryService } from '@/services/itinerary.service';
import { ItinerarySinglePageView } from '@/components/itinerary/ItinerarySinglePageView';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

import { TripHeroHeader } from '@/components/itinerary/TripHeroHeader';

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
  const totalPhotos = events.reduce((sum, e) => sum + (e.images?.length || 0), 0);

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18]">
      <main className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
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

        {/* Trip Hero Header with integrated Edit Modal */}
        <TripHeroHeader
          initialTrip={trip}
          eventsCount={events.length}
          totalPhotos={totalPhotos}
        />

        {/* Detailed Timeline View */}
        <ItinerarySinglePageView
          events={events}
          tripId={trip.id}
          tripTitle={trip.title}
          trip={trip}
        />
      </main>
    </div>
  );
}
