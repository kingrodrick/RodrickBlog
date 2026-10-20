import { supabase } from '@/lib/supabase';
import { TimelineEvent, Trip, GalleryImage } from '@/types/database.type';
import { sortTimelineEvents } from '@/lib/timeUtils';

export interface TripWithDetails extends Trip {
  timeline_events?: (TimelineEvent & {
    images?: GalleryImage[];
  })[];
}

export const ItineraryService = {
  // Lấy toàn bộ danh sách chuyến đi kèm ảnh đại diện từ các mốc thời gian
  async getAllTrips(): Promise<TripWithDetails[]> {
    const { data, error } = await supabase
      .from('trips')
      .select(
        `
        *,
        timeline_events (
          id,
          trip_id,
          day_number,
          trip_date,
          time_slot,
          location_name,
          city,
          category_tag,
          notes,
          images (*)
        )
      `
      )
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(`Lỗi truy vấn danh sách chuyến đi: ${error.message}`);
    }

    const trips = (data ?? []) as TripWithDetails[];
    trips.forEach((trip) => {
      if (trip.timeline_events) {
        trip.timeline_events = sortTimelineEvents(trip.timeline_events);
      }
    });

    return trips;
  },

  // Lấy chi tiết chuyến đi theo slug
  async getTripBySlug(slug: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.warn(`Không tìm thấy chuyến đi slug ${slug}: ${error.message}`);
      return null;
    }

    return data as Trip;
  },

  // Lấy chi tiết chuyến đi theo ID
  async getTripById(id: number): Promise<Trip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn(`Không tìm thấy chuyến đi id ${id}: ${error.message}`);
      return null;
    }

    return data as Trip;
  },

  // Lấy toàn bộ mốc thời gian kèm theo các bức ảnh thuộc mốc đó từ bảng images
  async getTimelineWithImages(tripId = 1): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from('timeline_events')
      .select(
        `
        *,
        images (*)
      `
      )
      .eq('trip_id', tripId)
      .order('trip_date', { ascending: true })
      .order('day_number', { ascending: true });

    if (error) {
      throw new Error(`Lỗi truy vấn lịch trình: ${error.message}`);
    }

    return sortTimelineEvents((data ?? []) as TimelineEvent[]);
  },

  // ==========================================
  // CÁC THAO TÁC BIÊN TẬP / QUẢN TRỊ (EDITOR)
  // ==========================================

  // Tạo chuyến đi mới
  async createTrip(tripData: {
    slug: string;
    title: string;
    summary?: string | null;
    cover_image?: string | null;
    start_date: string;
    end_date: string;
    cities: string;
    status: 'PLANNING' | 'ONGOING' | 'COMPLETED' | string;
  }): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .insert({
        slug: tripData.slug,
        title: tripData.title,
        summary: tripData.summary || null,
        cover_image: tripData.cover_image || null,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        cities: tripData.cities,
        status: tripData.status || 'PLANNING',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Trip;
  },

  // Cập nhật chuyến đi
  async updateTrip(id: number, tripData: Partial<Trip>): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .update(tripData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Trip;
  },

  // Xóa chuyến đi
  async deleteTrip(id: number): Promise<void> {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // Tạo mốc sự kiện timeline mới (kèm danh sách ảnh)
  async createTimelineEvent(
    eventData: {
      trip_id: number;
      day_number: number;
      trip_date: string;
      time_slot: string;
      location_name: string;
      city: string;
      category_tag: string;
      notes?: string | null;
    },
    imagesData?: Array<{
      cloudinary_url: string;
      caption?: string | null;
      city?: string | null;
      camera_gear?: string | null;
      exif_info?: string | null;
      is_featured?: boolean;
      is_real_photo?: boolean;
      taken_at?: string;
    }>
  ): Promise<TimelineEvent> {
    const { data: event, error: eventError } = await supabase
      .from('timeline_events')
      .insert({
        trip_id: eventData.trip_id,
        day_number: eventData.day_number,
        trip_date: eventData.trip_date,
        time_slot: eventData.time_slot,
        location_name: eventData.location_name,
        city: eventData.city,
        category_tag: eventData.category_tag,
        notes: eventData.notes || null,
      })
      .select()
      .single();

    if (eventError) {
      throw eventError;
    }

    if (imagesData && imagesData.length > 0) {
      const imagesToInsert = imagesData.map((img) => {
        let combinedGear = img.camera_gear || 'Sony A6400 • 18-135mm';
        if (img.exif_info && !combinedGear.includes(img.exif_info)) {
          combinedGear = `${combinedGear} (${img.exif_info})`;
        }
        return {
          cloudinary_url: img.cloudinary_url,
          caption: img.caption || null,
          city: img.city || eventData.city || 'Kyoto',
          camera_gear: combinedGear,
          timeline_event_id: event.id,
          is_featured: img.is_featured || false,
          is_real_photo: img.is_real_photo !== undefined ? img.is_real_photo : true,
          taken_at: img.taken_at || eventData.trip_date || new Date().toISOString(),
        };
      });

      const { error: imgError } = await supabase
        .from('images')
        .insert(imagesToInsert);

      if (imgError) {
        console.error('Lỗi khi chèn ảnh sự kiện:', imgError);
        throw imgError;
      }
    }

    // Nạp lại chi tiết sự kiện kèm danh sách ảnh
    const { data: fullEvent, error: fullError } = await supabase
      .from('timeline_events')
      .select('*, images (*)')
      .eq('id', event.id)
      .single();

    // Tự động đồng bộ lại day_number cho toàn bộ chuyến đi
    if (event?.trip_id) {
      await this.syncTripTimelineDayNumbers(event.trip_id);
    }

    return (fullEvent || event) as TimelineEvent;
  },

  // Cập nhật mốc sự kiện timeline (kèm đồng bộ danh sách ảnh)
  async updateTimelineEvent(
    id: number,
    eventData: Partial<Omit<TimelineEvent, 'id' | 'images'>>,
    imagesData?: Array<{
      id?: number;
      cloudinary_url: string;
      caption?: string | null;
      city?: string | null;
      camera_gear?: string | null;
      exif_info?: string | null;
      is_featured?: boolean;
      is_real_photo?: boolean;
      taken_at?: string;
    }>
  ): Promise<TimelineEvent> {
    const { data: updatedEvent, error: updateError } = await supabase
      .from('timeline_events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    if (imagesData !== undefined) {
      // Xóa các ảnh cũ của sự kiện này và chèn lại danh sách ảnh mới
      const { error: delError } = await supabase
        .from('images')
        .delete()
        .eq('timeline_event_id', id);

      if (delError) {
        console.error('Lỗi khi xóa ảnh cũ của sự kiện:', delError);
        throw delError;
      }

      if (imagesData.length > 0) {
        const imagesToInsert = imagesData.map((img) => {
          let combinedGear = img.camera_gear || 'Sony A6400 • 18-135mm';
          if (img.exif_info && !combinedGear.includes(img.exif_info)) {
            combinedGear = `${combinedGear} (${img.exif_info})`;
          }
          return {
            cloudinary_url: img.cloudinary_url,
            caption: img.caption || null,
            city: img.city || eventData.city || 'Kyoto',
            camera_gear: combinedGear,
            timeline_event_id: id,
            is_featured: img.is_featured || false,
            is_real_photo: img.is_real_photo !== undefined ? img.is_real_photo : true,
            taken_at: img.taken_at || eventData.trip_date || new Date().toISOString(),
          };
        });

        const { error: insertError } = await supabase
          .from('images')
          .insert(imagesToInsert);

        if (insertError) {
          console.error('Lỗi khi chèn lại ảnh sự kiện:', insertError);
          throw insertError;
        }
      }
    }

    // Lấy lại sự kiện kèm ảnh đầy đủ từ Supabase
    const { data: fullEvent, error: fullError } = await supabase
      .from('timeline_events')
      .select('*, images (*)')
      .eq('id', id)
      .single();

    if (fullError) {
      console.warn('Không thể nạp lại chi tiết sự kiện sau cập nhật:', fullError.message);
    }

    const result = (fullEvent || updatedEvent) as TimelineEvent;
    if (!result.images || result.images.length === 0) {
      if (imagesData && imagesData.length > 0) {
        result.images = imagesData.map((img, idx) => ({
          id: Date.now() + idx,
          cloudinary_url: img.cloudinary_url,
          caption: img.caption || null,
          city: img.city || eventData.city || null,
          camera_gear: img.camera_gear || null,
          exif_info: img.exif_info || null,
          timeline_event_id: id,
          is_featured: img.is_featured || false,
          is_real_photo: img.is_real_photo !== undefined ? img.is_real_photo : true,
          taken_at: img.taken_at || '',
          collection_id: null,
        }));
      }
    }

    const tripIdToSync = updatedEvent.trip_id || result.trip_id;
    if (tripIdToSync) {
      await this.syncTripTimelineDayNumbers(tripIdToSync);
    }

    return result;
  },

  // Xóa mốc sự kiện timeline
  async deleteTimelineEvent(id: number): Promise<void> {
    const { data: event } = await supabase
      .from('timeline_events')
      .select('trip_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (event?.trip_id) {
      await this.syncTripTimelineDayNumbers(event.trip_id);
    }
  },

  // Tự động đồng bộ số thứ tự ngày (day_number) dựa trên ngày thực tế (trip_date)
  async syncTripTimelineDayNumbers(tripId: number): Promise<void> {
    try {
      const { data: events, error } = await supabase
        .from('timeline_events')
        .select('id, day_number, trip_date')
        .eq('trip_id', tripId);

      if (error || !events || events.length === 0) return;

      // Danh sách tất cả các ngày duy nhất được sắp xếp từ sớm nhất đến muộn nhất
      const uniqueDates = Array.from(
        new Set(events.map((e) => e.trip_date).filter(Boolean))
      ).sort();

      if (uniqueDates.length === 0) return;

      // Map mỗi ngày thực tế tới số thứ tự ngày: Day 1, Day 2, Day 3...
      const dateToDayMap: Record<string, number> = {};
      uniqueDates.forEach((date, idx) => {
        dateToDayMap[date] = idx + 1;
      });

      // Cập nhật lại day_number cho các event bị lệch
      for (const ev of events) {
        const correctDay = dateToDayMap[ev.trip_date];
        if (correctDay && ev.day_number !== correctDay) {
          await supabase
            .from('timeline_events')
            .update({ day_number: correctDay })
            .eq('id', ev.id);
        }
      }

      // Cập nhật start_date của chuyến đi nếu ngày sớm nhất sớm hơn
      const earliestDate = uniqueDates[0];
      const { data: trip } = await supabase
        .from('trips')
        .select('start_date')
        .eq('id', tripId)
        .single();

      if (trip && earliestDate && (!trip.start_date || trip.start_date !== earliestDate)) {
        await supabase
          .from('trips')
          .update({ start_date: earliestDate })
          .eq('id', tripId);
      }
    } catch (err) {
      console.warn('Lỗi khi tự động đồng bộ day_number của chuyến đi:', err);
    }
  },
};
