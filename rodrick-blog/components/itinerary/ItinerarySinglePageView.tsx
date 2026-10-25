'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEvent, GalleryImage, Trip } from '@/types/database.type';
import { DayFilterTabs } from './DayFilterTabs';
import {
  TimelineItemCard,
  TimelineGalleryModal,
  GalleryTab,
  GalleryMode,
  splitEventPhotos,
  galleryTarget,
} from './TimelineItemCard';
import { TimelineRouteMap } from './TimelineRouteMap';
import { ImageLightboxModal } from '@/components/gallery/ImageLightboxModal';
import { PhotoStack } from '@/components/ui/PhotoStack';
import { PhotoFrame, photoKind, photoTagDetail } from '@/components/ui/PhotoFrame';
import { PhotoNav, stepIndex } from '@/components/ui/PhotoNav';
import { useAuth } from '@/components/auth/AuthContext';
import { AddTimelineEventModal } from '@/components/editor/AddTimelineEventModal';
import { EditTimelineEventModal } from '@/components/editor/EditTimelineEventModal';
import { SqlInstructionModal } from '@/components/editor/SqlInstructionModal';
import { sortTimelineEvents } from '@/lib/timeUtils';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import {
  formatDateVN,
  formatDuration,
  formatMonthYear,
  splitTimeSlot,
  tripDurationDays,
  weekdayVN,
} from '@/lib/tripFormat';
import { ItineraryService } from '@/services/itinerary.service';

interface ItinerarySinglePageViewProps {
  events: TimelineEvent[];
  tripId?: number;
  tripTitle?: string;
  trip?: Trip;
}

interface GalleryState {
  event: TimelineEvent;
  tab: GalleryTab;
  mode: GalleryMode;
  index: number;
}

// Tạm ẩn các section phụ cuối trang; đổi thành true để hiện lại
const SHOW_PRINCIPLES = false;
const SHOW_GEAR = false;

const GEAR = [
  { label: 'Body máy ảnh', value: 'Sony Alpha A6400' },
  { label: 'Ống kính đa dụng', value: 'Sony E 18-135mm OSS' },
  { label: 'Thẻ nhớ tốc độ cao', value: 'SanDisk Extreme Pro 128GB' },
  { label: 'Nguồn năng lượng', value: '3x NP-FW50 + Sạc đôi' },
  { label: 'Chân máy du lịch', value: 'Ulanzi Carbon Tripod' },
];

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
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  // Mốc đang được xem bản đồ trên sân khấu (đổi mốc thì sân khấu quay về ảnh)
  const [mapEventId, setMapEventId] = useState<number | null>(null);
  const [gallery, setGallery] = useState<GalleryState | null>(null);
  // Ảnh đang xem trên sân khấu, tính trong các ảnh của mốc đó (đổi mốc thì về ảnh đầu)
  const [stagePick, setStagePick] = useState<{ eventId: number; offset: number } | null>(null);

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

  // Tháng và độ dài chuyến đi từ bảng trips
  const { tripMonthYear, tripDuration } = useMemo(() => {
    const durationDays = tripDurationDays(currentTrip?.start_date, currentTrip?.end_date, days.length);
    return {
      tripMonthYear: formatMonthYear(currentTrip?.start_date),
      tripDuration: formatDuration(durationDays),
    };
  }, [currentTrip, days]);

  const tripCitiesLabel = currentTrip?.cities || cities.join(' & ') || 'Hành Trình';

  // City & Date context based on current view/filter for adding events
  const currentContextCity = useMemo(() => {
    if (selectedCity !== 'all') return selectedCity;
    if (selectedDay !== 'all') {
      const dayEvents = eventList.filter((e) => e.day_number === selectedDay);
      if (dayEvents.length > 0 && dayEvents[0].city) return dayEvents[0].city;
    }
    return cities[0] || 'Tokyo';
  }, [selectedCity, selectedDay, eventList, cities]);

  const currentContextDate = useMemo(() => {
    if (selectedDay !== 'all' && datesByDay[selectedDay]) {
      return datesByDay[selectedDay];
    }
    return undefined;
  }, [selectedDay, datesByDay]);

  // Mốc đang đọc: mốc nằm giữa màn hình khi cuộn, hoặc mốc vừa được trỏ tới
  const activeEvent =
    filteredEvents.find((e) => e.id === activeEventId) || filteredEvents[0] || null;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-event-id]'));
    if (rows.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveEventId(Number(entry.target.getAttribute('data-event-id')));
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    rows.forEach((row) => io.observe(row));
    return () => io.disconnect();
  }, [filteredEvents]);

  // Mọi ảnh của từng mốc (thực tế rồi tham khảo), xếp chồng trên sân khấu
  const stagePhotos = useMemo(
    () =>
      filteredEvents.flatMap((e) => {
        const { realPhotos, refPhotos } = splitEventPhotos(e.images);
        return [...realPhotos, ...refPhotos].map((image) => ({ event: e, image }));
      }),
    [filteredEvents]
  );

  const activePhotos = splitEventPhotos(activeEvent?.images);
  const activePhotoTotal = activePhotos.realPhotos.length + activePhotos.refPhotos.length;
  const stageOffset =
    activeEvent && stagePick?.eventId === activeEvent.id ? Math.min(stagePick.offset, activePhotoTotal - 1) : 0;
  const stageStart = stagePhotos.findIndex((p) => p.event.id === activeEvent?.id);
  const stageIndex = stageStart >= 0 ? stageStart + stageOffset : -1;
  const stageLead = stageIndex >= 0 ? stagePhotos[stageIndex].image : null;
  const activeHasMap = !!activeEvent?.map_embed_url && activeEvent.map_embed_url.trim().length > 0;
  const stageView = activeEvent && mapEventId === activeEvent.id ? 'map' : 'photo';
  const showMapOnStage = activeHasMap && (stageView === 'map' || !stageLead);

  const stepStage = (delta: number) =>
    activeEvent &&
    setStagePick({ eventId: activeEvent.id, offset: stepIndex(stageOffset, delta, activePhotoTotal) });

  const openGallery = (event: TimelineEvent, tab: GalleryTab, mode: GalleryMode, index = 0) =>
    setGallery({ event, tab, mode, index });

  const galleryPhotos = gallery ? splitEventPhotos(gallery.event.images) : null;

  return (
    <>
      <section id="itinerary" aria-labelledby="itinerary-title" className="scroll-mt-20 frame mt-32 lg:mt-48">
        {/* Đầu section */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8 lg:items-end">
          <div className="lg:col-span-7">
            <h2 id="itinerary-title" data-reveal className="text-head max-w-[14ch]">
              Lịch trình từng giờ
            </h2>
            <p data-reveal style={{ '--d': '80ms' } as React.CSSProperties} className="mt-6 max-w-[52ch]">
              {tripCitiesLabel}
              {tripMonthYear ? `, ${tripMonthYear}` : ''}
              {tripDuration ? `, ${tripDuration}` : ''}. {filteredEvents.length} mốc thời gian,{' '}
              {realCount} ảnh chụp thực tế và {refCount} ảnh tham khảo.
            </p>
          </div>

          {isLoggedIn && tripId && (
            <div className="lg:col-span-5 lg:text-right">
              <button type="button" onClick={() => setIsAddEventModalOpen(true)} className="btn">
                Thêm sự kiện timeline
              </button>
            </div>
          )}
        </div>

        <div className="mt-12">
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
        </div>

        {filteredEvents.length === 0 ? (
          <div className="mt-12 bg-paper p-8 sm:p-12 space-y-4">
            <h3 className="text-lead">Chưa có chặng hành trình nào trong cơ sở dữ liệu</h3>
            <p className="max-w-[52ch]">
              Các mốc lịch trình và kho ảnh tương ứng sẽ hiển thị sống động tại đây khi dữ liệu được
              đồng bộ.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              {(selectedDay !== 'all' || selectedCity !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay('all');
                    setSelectedCity('all');
                  }}
                  className="text-link font-semibold cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              )}
              {isLoggedIn && tripId && (
                <button type="button" onClick={() => setIsAddEventModalOpen(true)} className="btn">
                  Thêm sự kiện đầu tiên cho hành trình này
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Thời gian biểu */}
            <div className="min-w-0 lg:col-span-7 space-y-20">
              {eventsGroupedByDay.map((group) => {
                const uniqueDates = Array.from(
                  new Set(group.items.map((i) => i.trip_date).filter(Boolean))
                );
                const dateDisplay = uniqueDates
                  .map((d) => `${weekdayVN(d)} ${formatDateVN(d)}`)
                  .join(' → ');
                return (
                  <div key={group.dayNumber}>
                    <div data-reveal className="pb-6">
                      <h3 className="text-head">Ngày {group.dayNumber}</h3>
                      <p className="mt-3 text-small text-muted">
                        {dateDisplay}, {group.city}, {group.items.length} mốc
                      </p>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <TimelineItemCard
                          key={item.id}
                          item={item}
                          isActive={item.id === activeEvent?.id}
                          onActivate={(ev) => setActiveEventId(ev.id)}
                          onOpenGallery={openGallery}
                          onOpenImage={(img) => setActiveImage(img)}
                          onEdit={(itemToEdit) => setEditingEvent(itemToEdit)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Nút Thêm sự kiện Timeline ở cuối danh sách (chỉ hiện khi đã đăng nhập) */}
              {isLoggedIn && tripId && (
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="btn btn-ink w-full"
                >
                  Thêm sự kiện timeline
                </button>
              )}
            </div>

            {/* Sân khấu dính: nơi của mốc đang đọc */}
            <aside
              aria-label="Ảnh và bản đồ của mốc đang đọc"
              className="hidden lg:flex lg:col-start-8 lg:col-span-5 sticky top-[calc(var(--bar-h)+1.5rem)] self-start h-[min(calc(100svh-var(--bar-h)-3rem),50rem)] flex-col"
            >
              <div className="relative flex-1 min-h-0">
                {stagePhotos.length > 0 && (
                  <PhotoFrame
                    kind={photoKind(stageLead)}
                    detail={photoTagDetail(stageLead)}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      stageLead && !showMapOnStage ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <span className="relative flex-1 min-h-0 flex">
                      <button
                        type="button"
                        onClick={() => {
                          if (!activeEvent) return;
                          const { tab, index } = galleryTarget(activePhotos.realPhotos, stageOffset);
                          openGallery(activeEvent, tab, 'lightbox', index);
                        }}
                        disabled={!stageLead}
                        aria-label={activeEvent ? `Phóng to ảnh của ${activeEvent.location_name}` : 'Xem ảnh'}
                        className="flex-1 flex cursor-zoom-in"
                      >
                        <PhotoStack
                          photos={stagePhotos.map((p) => ({
                            key: `${p.event.id}-${p.image.id}`,
                            src: optimizeCloudinaryUrl(p.image.cloudinary_url),
                            alt: p.image.caption || p.event.location_name,
                          }))}
                          active={stageIndex}
                          fast
                          className="flex-1"
                        />
                      </button>
                      {stageLead && !showMapOnStage && (
                        <PhotoNav
                          index={stageOffset}
                          count={activePhotoTotal}
                          onPrev={() => stepStage(-1)}
                          onNext={() => stepStage(1)}
                        />
                      )}
                    </span>
                  </PhotoFrame>
                )}

                {showMapOnStage && activeEvent && (
                  <div className="absolute inset-0">
                    <TimelineRouteMap
                      key={activeEvent.id}
                      map_embed_url={activeEvent.map_embed_url}
                      locationName={activeEvent.location_name}
                      city={activeEvent.city}
                    />
                  </div>
                )}

                {/* Mốc không có ảnh lẫn bản đồ: tấm vé chữ của chính mốc đó */}
                {!stageLead && !activeHasMap && activeEvent && (
                  <div className="absolute inset-0 bg-accent text-accent-ink p-10 flex flex-col justify-between">
                    <p className="text-display leading-none tabular">
                      {splitTimeSlot(activeEvent.time_slot).start}
                    </p>
                    <p className="text-lead leading-tight max-w-[18ch]">{activeEvent.location_name}</p>
                  </div>
                )}
              </div>

              {activeEvent && (
                <div className="pt-4 flex items-start justify-between gap-6 text-small">
                  <p className="min-w-0">
                    {showMapOnStage
                      ? ''
                      : stageLead
                      ? `${stageLead.caption || activeEvent.location_name}${
                          stageLead.is_real_photo !== false && stageLead.exif_info ? `. ${stageLead.exif_info}` : ''
                        }`
                      : `${activeEvent.location_name}, chưa có ảnh`}
                  </p>
                  <div className="flex items-center gap-4 shrink-0">
                    {stageLead && activeHasMap && (
                      <button
                        type="button"
                        onClick={() => setMapEventId(stageView === 'map' ? null : activeEvent.id)}
                        className="text-link font-semibold cursor-pointer"
                      >
                        {stageView === 'map' ? 'Xem ảnh' : 'Xem tuyến đường'}
                      </button>
                    )}
                    {activePhotoTotal > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          openGallery(activeEvent, activePhotos.realPhotos.length > 0 ? 'real' : 'ref', 'grid')
                        }
                        className="text-link font-semibold cursor-pointer"
                      >
                        Xem {activePhotoTotal} ảnh
                      </button>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>

      {/* Nguyên tắc: trường màu duy nhất của trang, chạy hết bề ngang */}
      {SHOW_PRINCIPLES && (
      <section aria-labelledby="principles-title" className="mt-40 lg:mt-56 bg-accent text-accent-ink">
        <div className="frame py-24 lg:py-32 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <h2 id="principles-title" data-reveal className="text-display leading-[0.92] tracking-[-0.035em] lg:col-span-6 max-w-[10ch]">
            Nguyên tắc của Rodrick
          </h2>
          <div className="lg:col-start-8 lg:col-span-5 space-y-6">
            <blockquote
              data-reveal
              style={{ '--d': '80ms' } as React.CSSProperties}
              className="text-lead leading-[1.3]"
            >
              “Ăn món mình thích, chụp góc mình yêu, không chạy theo số đông.”
            </blockquote>
            <p data-reveal style={{ '--d': '160ms' } as React.CSSProperties}>
              <strong className="font-semibold">Ẩm thực độc hành:</strong> Tuyệt đối không ăn Sushi
              theo sở thích cá nhân. Ưu tiên hàng đầu là các quán Mì Ramen nước dùng xương hầm đậm đà,
              Cơm lươn nướng than hoa Unagi, Bò nướng than đá Yakiniku và Lẩu Sukiyaki béo ngậy.
            </p>
            <p data-reveal style={{ '--d': '240ms' } as React.CSSProperties}>
              <strong className="font-semibold">Phân loại nguồn ảnh:</strong> Mọi bức ảnh chụp thực tế
              bằng máy Sony A6400 được ghi rõ “Ảnh chụp thực tế” cùng thông số EXIF chi tiết. Các ảnh
              phục vụ mục đích tham khảo lịch trình được ghi rõ “Ảnh tham khảo” một cách minh bạch.
            </p>
            <p className="text-small pt-4">Tự do, độc hành, chân thực. Tokyo &amp; Kyoto 2026.</p>
          </div>
        </div>
      </section>
      )}

      {/* Thiết bị mang theo */}
      {SHOW_GEAR && (
      <section aria-labelledby="gear-title" className="frame mt-40 lg:mt-56 grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <h2 id="gear-title" data-reveal className="text-head max-w-[16ch]">
            Trang thiết bị nhiếp ảnh gọn nhẹ
          </h2>
          <table data-reveal style={{ '--d': '80ms' } as React.CSSProperties} className="mt-10 w-full text-left">
            <caption className="text-left text-small text-muted pb-4">
              Danh mục thiết bị mang theo (Sony A6400 gear)
            </caption>
            <tbody>
              {GEAR.map((row) => (
                <tr key={row.label} className="border-b border-surface" /* taste-skill-ignore: bảng thật */>
                  <th scope="row" className="py-4 pr-6 font-normal text-muted">
                    {row.label}
                  </th>
                  <td className="py-4 text-right font-semibold">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-reveal style={{ '--d': '120ms' } as React.CSSProperties} className="lg:col-start-9 lg:col-span-4 bg-paper p-8 sm:p-10 self-start">
          <p className="text-head leading-none tabular">15.000–25.000</p>
          <p className="mt-3 text-lead">bước mỗi ngày</p>
          <p className="mt-8">Tối ưu hóa trọng lượng để đi bộ 15.000 - 25.000 bước/ngày.</p>
        </div>
      </section>
      )}

      {/* Hộp ảnh của một mốc */}
      {gallery && galleryPhotos && (
        <TimelineGalleryModal
          key={`${gallery.event.id}-${gallery.tab}-${gallery.mode}-${gallery.index}`}
          isOpen
          onClose={() => setGallery(null)}
          locationName={gallery.event.location_name}
          timeSlot={gallery.event.time_slot}
          city={gallery.event.city}
          dayNumber={gallery.event.day_number}
          realPhotos={galleryPhotos.realPhotos}
          refPhotos={galleryPhotos.refPhotos}
          initialTab={gallery.tab}
          initialViewMode={gallery.mode}
          initialIndex={gallery.index}
          onOpenExternalImage={(img) => setActiveImage(img)}
        />
      )}

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
          defaultCity={currentContextCity}
          defaultDate={currentContextDate}
          availableCities={cities}
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
        tripTitle={currentTrip?.title || tripTitle}
        availableCities={cities}
      />

      {/* SQL Instruction Modal */}
      <SqlInstructionModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </>
  );
}

export default ItinerarySinglePageView;
