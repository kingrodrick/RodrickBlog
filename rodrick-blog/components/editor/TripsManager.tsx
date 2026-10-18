'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ItineraryService, TripWithDetails } from '@/services/itinerary.service';

interface TripsManagerProps {
  onSelectTripToAddEvent: (tripId: number) => void;
  onOpenSqlModal?: () => void;
}

export function TripsManager({
  onSelectTripToAddEvent,
  onOpenSqlModal,
}: TripsManagerProps) {
  const [trips, setTrips] = useState<TripWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const data = await ItineraryService.getAllTrips();
      setTrips(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách chuyến đi:', err);
      setMessage(err?.message || 'Không thể tải danh sách chuyến đi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa chuyến đi "${title}"? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await ItineraryService.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setMessage(`Đã xóa chuyến đi "${title}" thành công.`);
    } catch (err: any) {
      console.error('Lỗi khi xóa chuyến đi:', err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
        setMessage(
          'Supabase chặn quyền xóa dữ liệu (RLS). Vui lòng cấu hình lệnh SQL để mở quyền.'
        );
        if (onOpenSqlModal) {
          onOpenSqlModal();
        }
      } else {
        setMessage(err?.message || 'Không thể xóa chuyến đi này.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="bg-white border border-[#E6E2DA] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0ECE4]">
        <div>
          <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#B93829] font-bold">
            TỔNG QUAN HÀNH TRÌNH
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-1">
            Danh Sách Các Chuyến Du Lịch
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#78756E] mt-1">
            Quản lý các chuyến đi đã tạo, xem trước trên web hoặc bổ sung thêm mốc timeline.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTrips}
          className="self-start sm:self-auto text-xs font-mono text-[#1C1B18] hover:text-[#B93829] bg-[#FAF8F5] border border-[#E6E2DA] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>↻ Làm mới danh sách</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-[#B93829]/20 border-t-[#B93829] rounded-full animate-spin" />
          <p className="text-xs font-mono text-[#78756E]">Đang tải danh sách các chuyến đi...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="py-12 text-center space-y-3 border-2 border-dashed border-[#E6E2DA] rounded-2xl">
          <p className="text-base font-serif text-[#1C1B18] font-bold">Chưa có chuyến đi nào</p>
          <p className="text-xs font-sans text-[#78756E]">
            Hãy chuyển sang tab &quot;Thêm Chuyến Du Lịch&quot; để tạo chuyến đi đầu tiên!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {trips.map((trip) => {
            const eventCount = trip.timeline_events?.length || 0;
            const photoCount = (trip.timeline_events || []).reduce(
              (acc, e) => acc + (e.images?.length || 0),
              0
            );

            return (
              <div
                key={trip.id}
                className="p-5 rounded-2xl border border-[#E6E2DA] hover:border-stone-400 bg-[#FAF8F5] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {trip.cover_image ? (
                      <img
                        src={trip.cover_image}
                        alt={trip.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#E6E2DA] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-stone-200 flex items-center justify-center text-xl shrink-0">
                        ⛩️
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white border-[#E6E2DA] text-[#57544E] font-semibold">
                          ● {trip.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#78756E]">
                          📍 {trip.cities}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#1C1B18] leading-snug">
                        {trip.title}
                      </h3>
                      <p className="text-xs font-mono text-[#78756E]">
                        🗓 {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="flex sm:flex-col items-end gap-1.5 text-[11px] font-mono text-[#78756E] shrink-0">
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E6E2DA]">
                      ⏱ <strong>{eventCount}</strong> mốc sự kiện
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E6E2DA]">
                      📷 <strong>{photoCount}</strong> bức ảnh
                    </span>
                  </div>
                </div>

                {trip.summary && (
                  <p className="text-xs font-sans text-[#57544E] line-clamp-2 leading-relaxed pl-1">
                    {trip.summary}
                  </p>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-[#EAE6DE] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] font-mono text-[#78756E]">
                    Slug: <code className="text-[#1C1B18] bg-white px-1.5 py-0.5 rounded border border-[#E6E2DA]">/trips/{trip.slug}</code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectTripToAddEvent(trip.id)}
                      className="bg-white hover:bg-stone-100 text-[#B93829] hover:text-[#1C1B18] border border-rose-200 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      + Thêm sự kiện timeline
                    </button>

                    <Link
                      href={`/trips/${trip.slug}`}
                      target="_blank"
                      className="bg-[#1C1B18] hover:bg-[#B93829] text-white text-xs font-mono font-semibold px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
                    >
                      <span>Xem trang</span>
                      <span>↗</span>
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === trip.id}
                      onClick={() => handleDelete(trip.id, trip.title)}
                      className="text-stone-400 hover:text-rose-700 text-xs font-mono px-2 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Xóa chuyến đi"
                    >
                      {deletingId === trip.id ? 'Đang xóa...' : '✕ Xóa'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TripsManager;
