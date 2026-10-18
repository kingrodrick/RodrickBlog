'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TripWithDetails } from '@/services/itinerary.service';
import { TripCard } from './TripCard';
import { useAuth } from '@/components/auth/AuthContext';
import { CreateTripModal } from '@/components/editor/CreateTripModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';

interface TripsGridPageProps {
  initialTrips: TripWithDetails[];
}

export function TripsGridPage({ initialTrips }: TripsGridPageProps) {
  const { isLoggedIn } = useAuth();
  const [trips, setTrips] = useState<TripWithDetails[]>(initialTrips);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18] min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#78756E]">
          <Link href="/" className="hover:text-[#B93829] transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#1C1B18] font-semibold">Tất cả chuyến đi</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E0D8] pb-6 gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#B93829] text-[11px] font-mono font-bold tracking-wider uppercase">
              <span>● DANH MỤC HÀNH TRÌNH KHÁM PHÁ</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1B18]">
              Tất Cả Các Chuyến Đi Đã Lên Lịch
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#6E6B64] leading-relaxed">
              Tuyển tập trọn vẹn các chặng hành trình tự túc, kế hoạch chi tiết từng ngày/giờ và bộ sưu tập ảnh từ máy ảnh Sony A6400.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <span className="font-mono text-xs text-[#57544E] bg-white border border-[#E6E2DA] px-4 py-2 rounded-xl shadow-xs">
              🗺️ <strong>{trips.length}</strong> chuyến đi
            </span>

            {/* Editor Action: Only visible when logged in */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#B93829]/20 flex items-center gap-2 cursor-pointer"
              >
                <span>+</span>
                <span>THÊM CHUYẾN ĐI MỚI</span>
              </button>
            )}
          </div>
        </div>

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <div className="bg-white border border-[#E6E2DA] rounded-3xl p-12 text-center space-y-4">
            <span className="text-4xl">🧭</span>
            <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
              Chưa có chuyến đi nào được hiển thị
            </h3>
            <p className="text-xs text-[#78756E] max-w-md mx-auto">
              {isLoggedIn
                ? 'Hãy bấm vào nút "Thêm chuyến đi mới" bên trên để tạo chuyến đi đầu tiên của bạn.'
                : 'Các hành trình du lịch mới sẽ được tác giả cập nhật tại đây.'}
            </p>
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>+ Thêm chuyến đi ngay</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>

      {/* Modal create trip */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* SQL Instruction Modal */}
      <SqlInstructionModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}

export default TripsGridPage;
