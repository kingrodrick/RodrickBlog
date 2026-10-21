import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsBar } from '@/components/home/StatsBar';
import { TripListSection } from '@/components/itinerary/TripListSection';
import { GalleryShowcase } from '@/components/gallery/GalleryShowcase';
import { ItineraryService } from '@/services/itinerary.service';
import { GalleryService } from '@/services/gallery.service';
import { GalleryImage } from '@/types/database.type';

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

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18]">
      <main className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Khối giới thiệu mở đầu */}
        <HeroSection />

        {/* Thanh thống kê nhanh */}
        <StatsBar
          trips={trips}
          collections={collections}
          images={allImages}
        />

        {/* Module 1: Danh sách các chuyến đi (Điều hướng sang trang chi tiết) */}
        <TripListSection trips={trips} />

        {/* Module 2: Một số ảnh tiêu biểu từ bộ sưu tập */}
        <GalleryShowcase
          collections={collections}
          images={allImages}
          limit={6}
        />
      </main>
    </div>
  );
}