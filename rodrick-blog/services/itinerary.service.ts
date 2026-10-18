import { supabase } from '@/lib/supabase';
import { TimelineEvent, Trip, GalleryImage } from '@/types/database.type';

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

    return (data ?? []) as TripWithDetails[];
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
      .order('day_number', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) {
      throw new Error(`Lỗi truy vấn lịch trình: ${error.message}`);
    }

    return (data ?? []) as TimelineEvent[];
  },
};
