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
      const imagesToInsert = imagesData.map((img) => ({
        cloudinary_url: img.cloudinary_url,
        caption: img.caption || null,
        city: img.city || eventData.city,
        camera_gear: img.camera_gear || 'Sony A6400 • 18-135mm',
        exif_info: img.exif_info || null,
        timeline_event_id: event.id,
        is_featured: img.is_featured || false,
        is_real_photo: img.is_real_photo !== undefined ? img.is_real_photo : true,
        taken_at: img.taken_at || eventData.trip_date,
      }));

      const { error: imgError } = await supabase
        .from('images')
        .insert(imagesToInsert);

      if (imgError) {
        console.warn('Lỗi khi chèn ảnh sự kiện:', imgError.message);
      }
    }

    return event as TimelineEvent;
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
        console.warn('Lỗi khi xóa ảnh cũ của sự kiện:', delError.message);
      }

      if (imagesData.length > 0) {
        const imagesToInsert = imagesData.map((img) => ({
          cloudinary_url: img.cloudinary_url,
          caption: img.caption || null,
          city: img.city || eventData.city || 'Kyoto',
          camera_gear: img.camera_gear || 'Sony A6400 • 18-135mm',
          exif_info: img.exif_info || null,
          timeline_event_id: id,
          is_featured: img.is_featured || false,
          is_real_photo: img.is_real_photo !== undefined ? img.is_real_photo : true,
          taken_at: img.taken_at || eventData.trip_date || new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('images')
          .insert(imagesToInsert);

        if (insertError) {
          console.warn('Lỗi khi chèn lại ảnh sự kiện:', insertError.message);
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

    return (fullEvent || updatedEvent) as TimelineEvent;
  },

  // Xóa mốc sự kiện timeline
  async deleteTimelineEvent(id: number): Promise<void> {
    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};
