'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEvent, GalleryImage } from '@/types/database.type';
import { DayFilterTabs } from './DayFilterTabs';
import { TimelineItemCard } from './TimelineItemCard';
import { ImageLightboxModal } from '@/components/gallery/ImageLightboxModal';
import { useAuth } from '@/components/auth/AuthContext';
import { AddTimelineEventModal } from '@/components/editor/AddTimelineEventModal';
import { EditTimelineEventModal } from '@/components/editor/EditTimelineEventModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';

interface ItinerarySinglePageViewProps {
  events: TimelineEvent[];
  tripId?: number;
  tripTitle?: string;
}

export function ItinerarySinglePageView({ events, tripId, tripTitle }: ItinerarySinglePageViewProps) {
  const { isLoggedIn } = useAuth();
  const [eventList, setEventList] = useState<TimelineEvent[]>(events);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    setEventList(events);
  }, [events]);

  const handleEventCreated = (newEvent: TimelineEvent) => {
    setEventList((prev) => [...prev, newEvent]);
  };

  const handleEventUpdated = (updatedEvent: TimelineEvent) => {
    setEventList((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
    setEditingEvent(null);
  };

  const handleEventDeleted = (deletedEventId: number) => {
    setEventList((prev) => prev.filter((ev) => ev.id !== deletedEventId));
    setEditingEvent(null);
  };

  // Extract distinct days & cities
  const days = useMemo(() => {
    const daySet = new Set<number>();
    eventList.forEach((e) => daySet.add(e.day_number));
    return Array.from(daySet).sort((a, b) => a - b);
  }, [eventList]);

  const datesByDay = useMemo(() => {
    const map: Record<number, string> = {};
    eventList.forEach((e) => {
      if (e.day_number && e.trip_date) {
        map[e.day_number] = e.trip_date;
      }
    });
    return map;
  }, [eventList]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    eventList.forEach((e) => {
      if (e.city) citySet.add(e.city);
    });
    return Array.from(citySet).sort();
  }, [eventList]);

  // Filter events by day and city
  const filteredEvents = useMemo(() => {
    return eventList.filter((e) => {
      const matchDay = selectedDay === 'all' || e.day_number === selectedDay;
      const matchCity = selectedCity === 'all' || e.city.toLowerCase() === selectedCity.toLowerCase();
      return matchDay && matchCity;
    });
  }, [eventList, selectedDay, selectedCity]);

  // Count real photos vs reference photos
  const { realCount, refCount } = useMemo(() => {
    let real = 0;
    let ref = 0;
    filteredEvents.forEach((e) => {
      e.images?.forEach((img) => {
        if (img.is_real_photo !== false) {
          real++;
        } else {
          ref++;
        }
      });
    });
    return { realCount: real, refCount: ref };
  }, [filteredEvents]);

  // Group filtered events by day
  const eventsGroupedByDay = useMemo(() => {
    const groups: { dayNumber: number; city: string; items: TimelineEvent[] }[] = [];
    const map = new Map<number, TimelineEvent[]>();

    filteredEvents.forEach((e) => {
      const list = map.get(e.day_number) || [];
      list.push(e);
      map.set(e.day_number, list);
    });

    Array.from(map.keys())
      .sort((a, b) => a - b)
      .forEach((dayNum) => {
        const items = map.get(dayNum) || [];
        const city = items[0]?.city || 'Tokyo';
        groups.push({ dayNumber: dayNum, city, items });
      });

    return groups;
  }, [filteredEvents]);

  // Theme helper for each day
  const getDayTheme = (dayNumber: number, city: string, firstLoc?: string) => {
    switch (dayNumber) {
      case 1:
        return 'Khởi Hành: Narita → Khách Sạn Shinjuku';
      case 2:
        return 'Kiến Trúc Hiện Đại & Không Gian Shibuya Sky';
      case 3:
        return 'Văn Hóa Cổ Truyền: Asakusa, Ueno & Ginza';
      case 4:
        return 'Chuyển Đi Tới Kyoto: Arashiyama & Rừng Trúc Bạt Ngàn';
      case 5:
        return 'Đền Chùa & Phố Cổ: Fushimi Inari & Gion';
      case 6:
        return 'Kỷ Niệm Cố Đô & Khởi Hành Về Tokyo / Sân Bay';
      default:
        return firstLoc ? `Lịch Trình: ${firstLoc}` : `Khám Phá ${city}`;
    }
  };

  // Keep a running sequential index for all items across days
  let itemSequenceCounter = 0;

  return (
    <section id="itinerary" className="space-y-10 scroll-mt-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E0D8] pb-4 gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#B93829]">
            — LỊCH TRÌNH CHI TIẾT DU LỊCH & NHIẾP ẢNH
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1 text-[#1C1B18]">
            Lịch Trình Chi Tiết Chuyến Đi Nhật Bản
          </h2>
          <p className="font-mono text-[11px] text-[#78756E] mt-1">
            Tokyo & Kyoto (Tháng 12/2026 • 6 Ngày 7 Đêm) • Sony A6400 (18-135mm)
          </p>
        </div>

        {/* Breakdown Badges: Total, Real Photos, Reference Photos & Add Event Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[10px] bg-white border border-[#E6E2DA] px-3 py-1.5 rounded-full text-[#57544E]">
            ⏱ {filteredEvents.length} mốc thời gian
          </span>
          {realCount > 0 && (
            <span className="font-mono text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-full font-semibold">
              📷 {realCount} ảnh chụp thực tế
            </span>
          )}
          {refCount > 0 && (
            <span className="font-mono text-[10px] bg-sky-50 border border-sky-300 text-sky-800 px-3 py-1.5 rounded-full font-semibold">
              🌐 {refCount} ảnh tham khảo web
            </span>
          )}

          {/* Add Timeline Event Button (Only visible when logged in) */}
          {isLoggedIn && tripId && (
            <button
              type="button"
              onClick={() => setIsAddEventModalOpen(true)}
              className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md shadow-[#B93829]/20 flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <span>+</span>
              <span>THÊM SỰ KIỆN TIMELINE</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <DayFilterTabs
        days={days}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        totalFilteredCount={filteredEvents.length}
        datesByDay={datesByDay}
      />

      {/* Timeline List grouped by Day */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-10 text-center space-y-3">
          <span className="text-3xl">⛩️</span>
          <h4 className="font-serif text-lg font-bold text-[#1C1B18]">
            Chưa có chặng hành trình nào trong cơ sở dữ liệu
          </h4>
          <p className="text-xs text-[#78756E] max-w-md mx-auto leading-relaxed">
            Các mốc lịch trình và kho ảnh tương ứng sẽ hiển thị sống động tại đây khi dữ liệu được đồng bộ từ Supabase.
          </p>
          {(selectedDay !== 'all' || selectedCity !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedDay('all');
                setSelectedCity('all');
              }}
              className="mt-2 text-xs font-mono uppercase text-[#B93829] underline hover:no-underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}

          {isLoggedIn && tripId && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(true)}
                className="bg-[#B93829] hover:bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>+ Thêm sự kiện đầu tiên cho hành trình này</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {eventsGroupedByDay.map((group) => {
            const firstLoc = group.items[0]?.location_name;
            const themeTitle = getDayTheme(group.dayNumber, group.city, firstLoc);

            return (
              <div key={group.dayNumber} className="space-y-6">
                {/* Day Header Banner (As shown in screenshot) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] border-b-2 border-[#1C1B18] pb-3 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#1C1B18] text-white font-mono text-xs font-bold px-3 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow-xs">
                      <span className="text-[#B93829]">●</span>
                      DAY {group.dayNumber} — {group.city}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C1B18]">
                      {themeTitle}
                    </h3>
                  </div>

                  <span className="font-mono text-xs text-[#78756E]">
                    {group.items.length} mốc • 🗓 {group.items[0]?.trip_date}
                  </span>
                </div>

                {/* Vertical Timeline container for this day */}
                <div className="relative border-l-2 border-[#B93829]/30 ml-3 sm:ml-5 space-y-8 py-2">
                  {group.items.map((item) => {
                    itemSequenceCounter++;
                    return (
                      <TimelineItemCard
                        key={item.id}
                        item={item}
                        index={itemSequenceCounter}
                        onOpenImage={(img) => setActiveImage(img)}
                        onEdit={(itemToEdit) => setEditingEvent(itemToEdit)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Info Section: Travel Rules & Gear Checklist (Matching Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
        {/* Left Dark Box: Nguyên Tắc Du Lịch & Nhiếp Ảnh */}
        <div className="md:col-span-7 bg-[#1C1B18] text-white rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-rose-300 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <span>●</span> NGUYÊN TẮC DU LỊCH & NHIẾP ẢNH CỦA RODRICK
            </span>

            <h4 className="font-serif text-xl sm:text-2xl font-bold leading-snug">
              “Ăn món mình thích, chụp góc mình yêu, không chạy theo số đông.”
            </h4>

            <div className="space-y-2 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans pt-1">
              <p>
                <strong className="text-white font-serif">🍜 Ẩm thực độc hành:</strong> Tuyệt đối không ăn Sushi theo sở thích cá nhân. Ưu tiên hàng đầu là các quán Mì Ramen nước dùng xương hầm đậm đà, Cơm lươn nướng than hoa Unagi, Bò nướng than đá Yakiniku và Lẩu Sukiyaki béo ngậy.
              </p>
              <p>
                <strong className="text-white font-serif">📷 Phân loại nguồn ảnh:</strong> Mọi bức ảnh chụp thực tế bằng máy Sony A6400 được gắn nhãn xanh lục cùng thông số EXIF chi tiết. Các ảnh phục vụ mục đích tham khảo lịch trình được đánh dấu nhãn xanh dương minh bạch.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>Tự do • Độc hành • Chân thực</span>
            <span className="text-rose-400">Tokyo & Kyoto 2026</span>
          </div>
        </div>

        {/* Right Light Box: Danh Mục Thiết Bị Mang Theo */}
        <div className="md:col-span-5 bg-[#F3F0EA] border border-[#E6E2DA] rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-[#B93829] uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <span>📷</span> DANH MỤC THIẾT BỊ MANG THEO (SONY A6400 GEAR)
            </span>

            <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1C1B18]">
              Trang Thiết Bị Nhiếp Ảnh Gọn Nhẹ
            </h4>

            <ul className="space-y-2.5 text-xs text-[#57544E] font-mono">
              <li className="flex items-center justify-between border-b border-[#E6E2DA] pb-1.5">
                <span>Body Máy ảnh</span>
                <strong className="text-[#1C1B18]">Sony Alpha A6400</strong>
              </li>
              <li className="flex items-center justify-between border-b border-[#E6E2DA] pb-1.5">
                <span>Ống kính đa dụng</span>
                <strong className="text-[#1C1B18]">Sony E 18-135mm OSS</strong>
              </li>
              <li className="flex items-center justify-between border-b border-[#E6E2DA] pb-1.5">
                <span>Thẻ nhớ tốc độ cao</span>
                <strong className="text-[#1C1B18]">SanDisk Extreme Pro 128GB</strong>
              </li>
              <li className="flex items-center justify-between border-b border-[#E6E2DA] pb-1.5">
                <span>Nguồn năng lượng</span>
                <strong className="text-[#1C1B18]">3x NP-FW50 + Sạc đôi</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Chân máy du lịch</span>
                <strong className="text-[#1C1B18]">Ulanzi Carbon Tripod</strong>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#E6E2DA] text-[10px] font-mono text-[#8C8881]">
            ✓ Tối ưu hóa trọng lượng để đi bộ 15.000 - 25.000 bước/ngày
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        image={activeImage}
        onClose={() => setActiveImage(null)}
      />

      {/* Add Timeline Event Modal (Logged In Editor Only) */}
      {tripId && (
        <AddTimelineEventModal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
          tripId={tripId}
          onEventCreated={handleEventCreated}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />
      )}

      {/* Edit Timeline Event Modal (Logged In Editor Only) */}
      <EditTimelineEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* SQL Instruction Modal */}
      <SqlInstructionModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </section>
  );
}

export default ItinerarySinglePageView;
