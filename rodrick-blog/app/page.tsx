import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsBar } from '@/components/home/StatsBar';
import { TripListSection } from '@/components/itinerary/TripListSection';
import { GalleryShowcase } from '@/components/gallery/GalleryShowcase';
import { ItineraryService } from '@/services/itinerary.service';
import { GalleryService } from '@/services/gallery.service';
import { GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { pickNextTrip, tripCoverUrl } from '@/lib/tripFormat';

export const instant = false;

export default async function RodrickHomePage() {
  const [trips, collections, featuredImages] = await Promise.all([
    ItineraryService.getAllTrips(),
    GalleryService.getCollectionsWithImages(),
    GalleryService.getFeaturedImages(),
  ]);

  // Consolidate unique images across collections, trips and featured
  const imageMap = new Map<number, GalleryImage>();
  featuredImages.forEach((img) => imageMap.set(img.id, img));
  collections.forEach((col) => {
    col.images?.forEach((img) => imageMap.set(img.id, img));
  });
  trips.forEach((t) => {
    t.timeline_events?.forEach((ev) => {
      ev.images?.forEach((img) => imageMap.set(img.id, img));
    });
  });
  const allImages = Array.from(imageMap.values());

  // Ảnh lớn ở đầu trang: ảnh bìa các chuyến đi, rồi ảnh bìa các album
  const heroPhotos = [
    ...trips.map((t) => ({ key: `trip-${t.id}`, src: tripCoverUrl(t), alt: t.title })),
    ...collections
      .filter((c) => c.cover_image)
      .map((c) => ({
        key: `album-${c.id}`,
        src: optimizeCloudinaryUrl(c.cover_image as string),
        alt: c.title,
      })),
  ].slice(0, 5);

  const nextTrip = pickNextTrip(trips);

  return (
    <main className="w-full">
      {/* Tấm vé và ảnh lớn */}
      <HeroSection photos={heroPhotos} />

      {/* Mở đầu: các con số và đồng hồ chuyến đi kế tiếp */}
      <StatsBar
        trips={trips}
        collections={collections}
        images={allImages}
        nextTrip={nextTrip}
      />

      {/* Module 1: Danh sách các chuyến đi (Điều hướng sang trang chi tiết) */}
      <TripListSection trips={trips} />

      {/* Module 2: Một số ảnh tiêu biểu từ bộ sưu tập */}
      <GalleryShowcase
        collections={collections}
        images={allImages}
        limit={8}
      />
    </main>
  );
}
