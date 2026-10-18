import { supabase } from '@/lib/supabase';
import { Collection, GalleryImage } from '@/types/database.type';

export const GalleryService = {
  async getCollectionsWithImages(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        images (*)
      `
      )
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Lỗi truy vấn bộ sưu tập: ${error.message}`);
    }

    return (data ?? []) as Collection[];
  },

  async getFeaturedImages(): Promise<GalleryImage[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as GalleryImage[];
  },
};
