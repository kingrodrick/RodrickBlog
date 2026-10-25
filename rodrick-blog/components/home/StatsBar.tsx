import React from 'react';
import { TripWithDetails } from '@/services/itinerary.service';
import { Collection, GalleryImage } from '@/types/database.type';
import { TripClock } from '@/components/itinerary/TripClock';

interface StatsBarProps {
  trips?: TripWithDetails[];
  collections?: Collection[];
  images?: GalleryImage[];
  nextTrip?: TripWithDetails | null;
}

/** Mở đầu trang chủ: các con số viết thành câu, cạnh đồng hồ của chuyến đi kế tiếp */
export function StatsBar({
  trips = [],
  collections = [],
  images = [],
  nextTrip = null,
}: StatsBarProps) {
  const totalTrips = trips.length;
  const totalStops = trips.reduce(
    (acc, t) => acc + (t.timeline_events?.length || 0),
    0
  );
  const totalCollections = collections.length;
  const totalPhotos = images.length;

  return (
    <section
      aria-labelledby="intro-title"
      className="frame mt-32 lg:mt-48 grid gap-16 lg:grid-cols-12 lg:gap-8"
    >
      <div className="lg:col-span-5">
        <h2 id="intro-title" data-reveal className="text-head max-w-[14ch]">
          Nơi tôi lưu trữ những kỉ niệm
        </h2>
        <div className="mt-10 space-y-5 max-w-[46ch]">
          <p data-reveal style={{ '--d': '80ms' } as React.CSSProperties} className="font-semibold">
            Tuyển tập các chuyến đi tự túc. Chọn chuyến đi để xem timeline chi tiết từng ngày/giờ,
            ghi chú di chuyển, ẩm thực và hình ảnh.
          </p>
          <p data-reveal style={{ '--d': '160ms' } as React.CSSProperties}>
            Hiện có <strong className="font-semibold tabular">{totalTrips}</strong> hành trình đã lên
            lịch với <strong className="font-semibold tabular">{totalStops}</strong> mốc giờ chi tiết,{' '}
            <strong className="font-semibold tabular">{totalCollections}</strong> album ảnh và{' '}
            <strong className="font-semibold tabular">{totalPhotos}</strong> khung hình trong kho ảnh
            Sony A6400.
          </p>
        </div>
      </div>

      <div
        data-reveal
        style={{ '--d': '120ms' } as React.CSSProperties}
        className="lg:col-start-7 lg:col-span-6 bg-paper p-6 sm:p-10 xl:p-14"
      >
        {nextTrip ? (
          <>
            <h3 className="text-lead leading-tight max-w-[24ch]">
              Chuyến đi kế tiếp: {nextTrip.title}
            </h3>
            <div className="mt-10">
              <TripClock
                variant="figure"
                events={nextTrip.timeline_events || []}
                startDate={nextTrip.start_date}
                endDate={nextTrip.end_date}
                cities={nextTrip.cities}
                tripHref={`/trips/${nextTrip.slug}`}
              />
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lead leading-tight">Chuyến đi kế tiếp</h3>
            <p className="mt-6">Chưa có chuyến đi nào trong cơ sở dữ liệu.</p>
          </>
        )}
      </div>
    </section>
  );
}

export default StatsBar;
