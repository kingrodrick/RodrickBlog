'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEvent, GalleryImage, Trip } from '@/types/database.type';
import { DayFilterTabs } from './DayFilterTabs';
import { TimelineItemCard } from './TimelineItemCard';
import { ImageLightboxModal } from '@/components/gallery/ImageLightboxModal';
import { useAuth } from '@/components/auth/AuthContext';
import { AddTimelineEventModal } from '@/components/editor/AddTimelineEventModal';
import { EditTimelineEventModal } from '@/components/editor/EditTimelineEventModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';
import { sortTimelineEvents } from '@/lib/timeUtils';
import { ItineraryService } from '@/services/itinerary.service';

interface ItinerarySinglePageViewProps {
  events: TimelineEvent[];
  tripId?: number;
  tripTitle?: string;
  trip?: Trip;
}

export function ItinerarySinglePageView({
  events,
  tripId,
  tripTitle,
  trip,
}: ItinerarySinglePageViewProps) {
  const { isLoggedIn } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(trip || null);
  const [eventList, setEventList] = useState<TimelineEvent[]>(() => sortTimelineEvents(events));
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    setEventList(sortTimelineEvents(events));
  }, [events]);

  // Sync trip when prop changes or load by tripId
  useEffect(() => {
    if (trip) {
      setCurrentTrip(trip);
    } else if (tripId) {
      ItineraryService.getTripById(tripId)
        .then((data) => {
          if (data) setCurrentTrip(data);
        })
        .catch(console.error);
    }
  }, [trip, tripId]);

  const refreshTimeline = async () => {
    if (tripId) {
      try {
        const [freshEvents, freshTrip] = await Promise.all([
          ItineraryService.getTimelineWithImages(tripId),
          ItineraryService.getTripById(tripId),
        ]);
        setEventList(sortTimelineEvents(freshEvents));
        if (freshTrip) {
          setCurrentTrip(freshTrip);
        }
      } catch (err) {
        console.error('Lỗi làm mới timeline:', err);
      }
    }
  };

  const handleEventCreated = (newEvent: TimelineEvent) => {
    setEventList((prev) => sortTimelineEvents([...prev, newEvent]));
    refreshTimeline();
  };

  const handleEventUpdated = (updatedEvent: TimelineEvent) => {
    setEventList((prev) =>
      sortTimelineEvents(prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)))
    );
    setEditingEvent(null);
    refreshTimeline();
  };

  const handleEventDeleted = (deletedEventId: number) => {
    setEventList((prev) => prev.filter((ev) => ev.id !== deletedEventId));
    setEditingEvent(null);
    refreshTimeline();
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

  const existingDates = useMemo(() => {
    return Array.from(new Set(eventList.map((e) => e.trip_date).filter(Boolean)));
  }, [eventList]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    eventList.forEach((e) => {
      if (e.city) citySet.add(e.city);
    });
    return Array.from(citySet).sort();
  }, [eventList]);

  // Filter events by day and city (always sorted chronologically)
  const filteredEvents = useMemo(() => {
    const list = eventList.filter((e) => {
      const matchDay = selectedDay === 'all' || e.day_number === selectedDay;
      const matchCity = selectedCity === 'all' || e.city.toLowerCase() === selectedCity.toLowerCase();
      return matchDay && matchCity;
    });
    return sortTimelineEvents(list);
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

  // Group filtered events by day (with items sorted chronologically)
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
        const rawItems = map.get(dayNum) || [];
        const items = sortTimelineEvents(rawItems);
        const city = items[0]?.city || 'Tokyo';
        groups.push({ dayNumber: dayNum, city, items });
      });

    return groups;
  }, [filteredEvents]);

  // Dynamic trip title, dates, and gear from trips table
  const tripDisplayTitle = useMemo(() => {
    const title = currentTrip?.title || tripTitle;
    if (!title) return 'Lịch Trình Chi Tiết Chuyến Đi';
    if (title.toLowerCase().startsWith('lịch trình')) {
      return title;
    }
    return `${title}`;
  }, [currentTrip, tripTitle]);

  const { tripMonthYear, tripDuration } = useMemo(() => {
    if (currentTrip?.start_date && currentTrip?.end_date) {
      const startParts = currentTrip.start_date.split('-').map(Number);
      const endParts = currentTrip.end_date.split('-').map(Number);

      let durationDays = days.length;
      if (startParts.length === 3 && endParts.length === 3) {
        const startDateObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const endDateObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);
        const diffDays = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (!isNaN(diffDays) && diffDays > 0) {
          durationDays = Math.max(durationDays, diffDays);
        }
      }

      const monthYear = startParts.length === 3 ? `Tháng ${startParts[1]}/${startParts[0]}` : '';
      const duration = durationDays > 0 ? `${durationDays} Ngày ${Math.max(0, durationDays - 1)} Đêm` : '';

      return { tripMonthYear: monthYear, tripDuration: duration };
    }

    const duration = days.length > 0 ? `${days.length} Ngày ${Math.max(0, days.length - 1)} Đêm` : '';
    return { tripMonthYear: '', tripDuration: duration };
  }, [currentTrip, days]);

  const tripCitiesLabel = currentTrip?.cities || cities.join(' & ') || 'Hành Trình';

  let itemSequenceCounter = 0;

  return (
    <section id="itinerary" className="space-y-10 scroll-mt-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E0D8] pb-4 gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#B93829]">
            — LỊCH TRÌNH CHI TIẾT DU LỊCH & NHIẾP ẢNH
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-2 text-[#1C1B18]">
            {tripDisplayTitle}
          </h2>
          <p className="flex flex-wrap items-center font-mono text-[11px] text-[#78756E] mt-2">
            <span>{tripCitiesLabel}</span>
            {tripMonthYear && (
              <>
                <span className="mx-2.5">•</span>
                <span>{tripMonthYear}</span>
              </>
            )}
            {tripDuration && (
              <>
                <span className="mx-2.5">•</span>
                <span>{tripDuration}</span>
              </>
            )}
          </p>
        </div>

        {/* Breakdown Badges: Total, Real Photos, Reference Photos & Add Event Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[10px] bg-white border border-[#E6E2DA] px-3 py-1.5 rounded-full text-[#57544E]">
            ⏱ {filteredEvents.length} mốc thời gian
          </span>
          {/* {realCount > 0 && (
            <span className="font-mono text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-full font-semibold">
              📷 {realCount} ảnh chụp thực tế
            </span>
          )}
          {refCount > 0 && (
            <span className="font-mono text-[10px] bg-sky-50 border border-sky-300 text-sky-800 px-3 py-1.5 rounded-full font-semibold">
              🌐 {refCount} ảnh tham khảo web
            </span>
          )} */}

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
            Các mốc lịch trình và kho ảnh tương ứng sẽ hiển thị sống động tại đây khi dữ liệu được đồng bộ.
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
            return (
              <div key={group.dayNumber} className="space-y-6">
                {/* Day Header Banner (As shown in screenshot) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] border-b-2 border-[#1C1B18] pb-3 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#1C1B18] text-white font-mono text-xs font-bold px-3 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow-xs">
                      <span className="text-[#B93829]">●</span>
                      DAY {group.dayNumber} — {group.city}
                    </span>
                  </div>

                  {(() => {
                    const uniqueDates = Array.from(
                      new Set(group.items.map((i) => i.trip_date).filter(Boolean))
                    );
                    const dateDisplay =
                      uniqueDates.length > 1
                        ? uniqueDates.join(' → ')
                        : group.items[0]?.trip_date || '';
                    return (
                      <span className="font-mono text-xs text-[#78756E]">
                        {group.items.length} mốc • 🗓 {dateDisplay}
                      </span>
                    );
                  })()}
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
          existingDates={existingDates}
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
        existingDates={existingDates}
        tripSlug={currentTrip?.slug}
        tripTitle={currentTrip?.title}
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
