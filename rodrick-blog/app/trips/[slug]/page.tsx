import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ItineraryService } from '@/services/itinerary.service';
import { ItinerarySinglePageView } from '@/components/itinerary/ItinerarySinglePageView';

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
    <main className="w-full">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Vị trí trang" className="frame pt-2 pb-4 text-small">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
          <li>
            <Link href="/" className="text-link">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/trips" className="text-link">
              Hành trình
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink font-semibold truncate max-w-[60vw]">
            {trip.title}
          </li>
        </ol>
      </nav>

      {/* Trip Hero Header with integrated Edit Modal */}
      <TripHeroHeader
        initialTrip={trip}
        eventsCount={events.length}
        totalPhotos={totalPhotos}
        events={events}
      />

      {/* Detailed Timeline View */}
      <ItinerarySinglePageView
        events={events}
        tripId={trip.id}
        tripTitle={trip.title}
        trip={trip}
      />
    </main>
  );
}
