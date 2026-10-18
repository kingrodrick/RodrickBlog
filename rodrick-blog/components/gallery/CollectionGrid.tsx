'use client';

import React, { useState, useMemo } from 'react';
import { Collection, GalleryImage } from '@/types/database.type';
import { PhotoCard } from './PhotoCard';
import { ImageLightboxModal } from './ImageLightboxModal';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface CollectionGridProps {
  collections: Collection[];
  allImages?: GalleryImage[];
}

export function CollectionGrid({
  collections,
  allImages: initialImages,
}: CollectionGridProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Flatten all images across all collections if not passed directly
  const allImages = useMemo(() => {
    if (initialImages && initialImages.length > 0) return initialImages;
    const list: GalleryImage[] = [];
    collections.forEach((col) => {
      if (col.images && col.images.length > 0) {
        col.images.forEach((img) => {
          if (!list.some((existing) => existing.id === img.id)) {
            list.push(img);
          }
        });
      }
    });
    return list;
  }, [collections, initialImages]);

  // Extract cities from all available images
  const cities = useMemo(() => {
    const set = new Set<string>();
    allImages.forEach((img) => {
      if (img.city) set.add(img.city);
    });
    return Array.from(set).sort();
  }, [allImages]);

  // Filter images by selected collection & city
  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      const matchCol =
        selectedCollectionId === 'all' || img.collection_id === selectedCollectionId;
      const matchCity =
        selectedCity === 'all' || img.city?.toLowerCase() === selectedCity.toLowerCase();
      return matchCol && matchCity;
    });
  }, [allImages, selectedCollectionId, selectedCity]);

  return (
    <section id="gallery" className="space-y-8 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E0D8] pb-4 gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#B93829]">
            — MODULE 02 • BỘ SƯU TẬP NHIẾP ẢNH (COLLECTIONS & IMAGES)
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1 text-[#1C1B18]">
            Triển Lãm & Kho Lưu Trữ Nhiếp Ảnh
          </h2>
          <p className="text-xs text-[#6E6B64] mt-1 max-w-xl">
            Những khung hình thực tế ghi lại nhịp sống hiện đại Tokyo và chiều sâu cổ kính Kyoto, chụp từ máy ảnh{' '}
            <strong className="text-[#1C1B18] font-mono">Sony A6400 (kèm lens 18-135mm)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#78756E] bg-white border border-[#E6E2DA] px-3 py-1 rounded-full">
            📷 {allImages.length} tác phẩm trong kho lưu trữ
          </span>
        </div>
      </div>

      {/* Collection Cards Overview */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => {
            const isSelected = selectedCollectionId === col.id;
            const count = col.images?.length || 0;
            const coverUrl = col.cover_image
              ? optimizeCloudinaryUrl(col.cover_image)
              : 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={col.id}
                onClick={() =>
                  setSelectedCollectionId(isSelected ? 'all' : col.id)
                }
                className={`group rounded-2xl border overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#F3F0EA] border-[#B93829] shadow-md ring-2 ring-[#B93829]/20'
                    : 'bg-white border-[#E6E2DA] hover:border-[#D0C9BD] hover:shadow-xs'
                }`}
              >
                {/* Cover Image */}
                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-[#F3F0EA]">
                  <img
                    src={coverUrl}
                    alt={col.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 text-[#B93829] text-[10px] font-mono font-bold uppercase tracking-wider">
                      ALBUM #{col.display_order}
                    </span>
                    <span className="bg-black/60 text-white text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full">
                      📍 {col.location_tag || 'Nhật Bản'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug drop-shadow-sm">
                      {col.title}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  {col.description && (
                    <p className="text-xs text-[#57544E] leading-relaxed line-clamp-2">
                      {col.description}
                    </p>
                  )}

                  <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-[11px] font-mono text-[#B93829]">
                    <span>{isSelected ? '✓ Đang lọc theo Album này' : `📷 ${count} ảnh • Bấm để lọc`}</span>
                    <span>{isSelected ? '✕ Hủy lọc' : '→'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-[#E6E2DA] pb-3">
        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C8881]">
            LỌC THÀNH PHỐ:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCity('all')}
            className={`px-3 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
              selectedCity === 'all'
                ? 'bg-[#1C1B18] text-white border-[#1C1B18]'
                : 'bg-white text-[#57544E] border-[#E6E2DA] hover:border-[#1C1B18]'
            }`}
          >
            Tất cả ({allImages.length})
          </button>
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                selectedCity === city
                  ? 'bg-[#B93829] text-white border-[#B93829]'
                  : 'bg-white text-[#57544E] border-[#E6E2DA] hover:border-[#B93829]'
              }`}
            >
              📍 {city}
            </button>
          ))}
        </div>

        {/* Reset / Count Indicator */}
        <div className="flex items-center gap-3 text-xs font-mono text-[#8C8881]">
          <span>
            Đang hiển thị:{' '}
            <strong className="text-[#1C1B18]">{filteredImages.length}</strong> bức ảnh
          </span>
          {(selectedCollectionId !== 'all' || selectedCity !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCollectionId('all');
                setSelectedCity('all');
              }}
              className="text-[#B93829] underline hover:no-underline cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Photos Grid */}
      {filteredImages.length === 0 ? (
        <div className="bg-white border border-[#E6E2DA] rounded-xl p-10 text-center space-y-3">
          <span className="text-3xl">📷</span>
          <h4 className="font-serif text-lg font-bold text-[#1C1B18]">
            Chưa có bức ảnh nào phù hợp với bộ lọc hiện tại
          </h4>
          <p className="text-xs text-[#78756E]">
            Thử chuyển sang album khác hoặc chọn hiển thị tất cả ảnh.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <PhotoCard
              key={image.id}
              image={image}
              onClick={(img) => setSelectedImage(img)}
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightboxModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </section>
  );
}

export default CollectionGrid;
