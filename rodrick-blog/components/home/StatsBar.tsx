import React from 'react';
import { TripWithDetails } from '@/services/itinerary.service';
import { Collection, GalleryImage } from '@/types/database.type';

interface StatsBarProps {
  trips?: TripWithDetails[];
  collections?: Collection[];
  images?: GalleryImage[];
}

export function StatsBar({
  trips = [],
  collections = [],
  images = [],
}: StatsBarProps) {
  const totalTrips = trips.length;
  const totalStops = trips.reduce(
    (acc, t) => acc + (t.timeline_events?.length || 0),
    0
  );
  const totalCollections = collections.length;
  const totalPhotos = images.length;

  return (
    <section className="bg-[#F3F0EA] border border-[#E5E0D8] rounded-xl p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C8881]">
          CHUYẾN ĐI ĐÃ LÊN LỊCH
        </span>
        <div className="font-serif text-3xl font-bold text-[#1C1B18]">
          {totalTrips}{' '}
          <span className="text-sm font-normal text-[#78756E]">hành trình</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C8881]">
          BỘ SƯU TẬP ẢNH
        </span>
        <div className="font-serif text-3xl font-bold text-[#1C1B18]">
          {totalCollections}{' '}
          <span className="text-sm font-normal text-[#78756E]">album ảnh</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C8881]">
          KHO ẢNH SONY A6400
        </span>
        <div className="font-serif text-3xl font-bold text-[#1C1B18]">
          {totalPhotos}{' '}
          <span className="text-sm font-normal text-[#78756E]">ảnh</span>
        </div>
      </div>
    </section>
  );
}

export default StatsBar;
