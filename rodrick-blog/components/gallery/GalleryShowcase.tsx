'use client';

import React, { useState } from 'react';
import { Collection, GalleryImage } from '@/types/database.type';
import { PhotoCard } from './PhotoCard';
import { ImageLightboxModal } from './ImageLightboxModal';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

interface GalleryShowcaseProps {
  collections: Collection[];
  images: GalleryImage[];
  limit?: number;
}

export function GalleryShowcase({
  collections,
  images,
  limit = 6,
}: GalleryShowcaseProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<number | 'all'>('all');

  // Filter images if an album is selected, otherwise take up to limit
  const filteredImages =
    activeCollectionId === 'all'
      ? images
      : images.filter((img) => img.collection_id === activeCollectionId);

  const displayImages = filteredImages.slice(0, limit);

  // Helper to open collection cover in lightbox
  const handleOpenCoverInLightbox = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!col.cover_image) return;

    setSelectedImage({
      id: -col.id,
      cloudinary_url: col.cover_image,
      caption: `${col.title} (Ảnh bìa Album)`,
      city: col.location_tag?.split(',')[0] || 'Nhật Bản',
      camera_gear: 'Sony A6400 • 18-135mm',
      exif_info: 'Ảnh Bìa Album • Full HD',
      collection_id: col.id,
      timeline_event_id: null,
      is_featured: true,
      taken_at: '',
    });
  };

  return (
    <section id="gallery" className="space-y-8 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E5E0D8] pb-4 gap-4">
        <div className="flex-1 max-w-3xl lg:max-w-4xl">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#B93829]">
            — BỘ SƯU TẬP NHIẾP ẢNH (COLLECTIONS & ALBUMS)
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1 text-[#1C1B18]">
            Kho Lưu Trữ Khung Hình Sony A6400
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6B64] mt-1 max-w-2xl sm:max-w-3xl lg:max-w-4xl leading-relaxed">
            Các album chủ đề ghi lại nhịp sống đô thị và văn hóa truyền thống Nhật Bản chụp bằng máy ảnh{' '}
            <strong className="text-[#1C1B18] font-mono">Sony A6400 (lens 18-135mm)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-[#78756E] bg-white border border-[#E6E2DA] px-3.5 py-1.5 rounded-full">
            📷 {collections.length} album • {images.length} khung hình đã đồng bộ
          </span>
        </div>
      </div>

      {/* Album Cards Showcase with Cover Images */}
      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((col) => {
            const isSelected = activeCollectionId === col.id;
            const count = col.images?.length || 0;
            const coverUrl = col.cover_image
              ? optimizeCloudinaryUrl(col.cover_image)
              : 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={col.id}
                onClick={() =>
                  setActiveCollectionId(isSelected ? 'all' : col.id)
                }
                className={`group bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#B93829] ring-2 ring-[#B93829]/20 shadow-md'
                    : 'border-[#E6E2DA] hover:border-[#D0C9BD]'
                }`}
              >
                {/* Album Cover Banner */}
                <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-[#F3F0EA]">
                  <img
                    src={coverUrl}
                    alt={col.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Vignette / Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#B93829] border border-rose-200 text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
                      ALBUM #{col.display_order}
                    </span>
                    <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                      📍 {col.location_tag || 'Nhật Bản'}
                    </span>
                  </div>

                  {/* Bottom Image Overlay: Title & Stats */}
                  <div className="absolute bottom-4 left-4 right-4 text-white space-y-1.5">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold leading-snug drop-shadow-sm group-hover:text-rose-100 transition-colors">
                      {col.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-stone-300">
                      <span>📷 {count} bức ảnh</span>
                      <span>•</span>
                      <span>Sony A6400 (18-135mm)</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {col.description && (
                    <p className="text-xs sm:text-sm text-[#57544E] leading-relaxed line-clamp-2">
                      {col.description}
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={(e) => handleOpenCoverInLightbox(col, e)}
                      className="text-[#78756E] hover:text-[#1C1B18] underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      🔍 Phóng to ảnh bìa
                    </button>

                    <div className="flex items-center gap-1.5 font-semibold text-[#B93829]">
                      <span>
                        {isSelected ? '✓ Đang lọc album này' : 'Lọc ảnh album này'}
                      </span>
                      <span>{isSelected ? '✕' : '→'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Reset Indicator if an album is filtered */}
      {activeCollectionId !== 'all' && (
        <div className="flex items-center justify-between bg-[#F3F0EA] border border-[#E6E2DA] rounded-xl px-4 py-2.5 text-xs font-mono text-[#57544E]">
          <span>
            Đang lọc theo Album #{collections.find((c) => c.id === activeCollectionId)?.display_order}:{' '}
            <strong className="text-[#1C1B18]">
              {collections.find((c) => c.id === activeCollectionId)?.title}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setActiveCollectionId('all')}
            className="text-[#B93829] font-semibold hover:underline cursor-pointer"
          >
            ✕ Xem tất cả album
          </button>
        </div>
      )}

      {/* Curated Photos Grid */}
      {displayImages.length === 0 ? (
        <div className="bg-white border border-[#E6E2DA] rounded-xl p-10 text-center space-y-3">
          <span className="text-3xl">📷</span>
          <h4 className="font-serif text-lg font-bold text-[#1C1B18]">
            {activeCollectionId === 'all'
              ? 'Chưa có khung hình rời trong bảng `images`'
              : 'Album này chưa có ảnh chi tiết trong bảng `images`'}
          </h4>
          <p className="text-xs text-[#78756E] max-w-md mx-auto leading-relaxed">
            Ảnh bìa của album đã được hiển thị sống động ở phía trên. Khi bạn thêm ảnh vào bảng <code className="bg-[#F3F0EA] px-1 py-0.5 rounded text-[#1C1B18] font-mono">images</code> với <code className="bg-[#F3F0EA] px-1 py-0.5 rounded text-[#1C1B18] font-mono">collection_id</code> tương ứng, các ảnh thành phần sẽ tự động xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayImages.map((image) => (
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

export default GalleryShowcase;

