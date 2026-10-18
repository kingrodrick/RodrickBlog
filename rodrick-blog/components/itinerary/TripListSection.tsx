import React from 'react';
import { TripWithDetails } from '@/services/itinerary.service';
import { TripCard } from './TripCard';

interface TripListSectionProps {
  trips: TripWithDetails[];
}

export function TripListSection({ trips }: TripListSectionProps) {
  return (
    <section id="trips" className="space-y-8 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E0D8] pb-4 gap-4">
        <div className="flex-1 max-w-3xl lg:max-w-4xl">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#B93829]">
            — CÁC CHUYẾN ĐI ĐÃ LÊN LỊCH
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1 text-[#1C1B18]">
            Hành Trình Khám Phá & Ký Sự Độc Hành
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6B64] mt-1 max-w-2xl sm:max-w-3xl lg:max-w-4xl leading-relaxed">
            Tuyển tập các chuyến đi tự túc. Chọn chuyến đi để xem timeline chi tiết từng ngày/giờ, ghi chú di chuyển, ẩm thực và hình ảnh.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-[#57544E] bg-white border border-[#E6E2DA] px-3.5 py-1.5 rounded-full">
            🗺️ {trips.length} chuyến đi trong dữ liệu
          </span>
        </div>
      </div>

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <div className="bg-white border border-[#E6E2DA] rounded-xl p-10 text-center space-y-2">
          <span className="text-3xl">🧭</span>
          <h4 className="font-serif text-lg font-bold text-[#1C1B18]">
            Chưa có chuyến đi nào trong cơ sở dữ liệu
          </h4>
          <p className="text-xs text-[#78756E]">
            Vui lòng thêm chuyến đi mới vào bảng `trips` trên Supabase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  );
}

export default TripListSection;
