'use client';

import React, { useState } from 'react';
import { Collection, GalleryImage } from '@/types/database.type';
import { ImageLightboxModal } from './ImageLightboxModal';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { PhotoStack, useAutoAdvance } from '@/components/ui/PhotoStack';

interface GalleryShowcaseProps {
  collections: Collection[];
  images: GalleryImage[];
  limit?: number;
}

const FALLBACK_ALBUM_COVER =
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80';

export function GalleryShowcase({
  collections,
  images,
  limit = 6,
}: GalleryShowcaseProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<number | 'all'>('all');
  const [isHolding, setIsHolding] = useState(false);

  // Lọc ảnh theo album đang chọn, rồi giới hạn số ảnh hiển thị
  const filteredImages =
    activeCollectionId === 'all'
      ? images
      : images.filter((img) => img.collection_id === activeCollectionId);

  const displayImages = filteredImages.slice(0, limit);
  const [rawIndex, setIndex] = useAutoAdvance(displayImages.length, 3200, isHolding);
  const index = Math.min(rawIndex, Math.max(displayImages.length - 1, 0));
  const current = displayImages[index];

  const selectCollection = (id: number | 'all') => {
    setActiveCollectionId(id);
    setIndex(0);
  };

  // Mở ảnh bìa album trong lightbox
  const handleOpenCoverInLightbox = (col: Collection) => {
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

  const photos = displayImages.map((img) => ({
    key: img.id,
    src: optimizeCloudinaryUrl(img.cloudinary_url),
    alt: img.caption || 'Ảnh chụp Sony A6400',
  }));

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-title"
      className="scroll-mt-20 frame mt-40 lg:mt-56 grid gap-12 lg:grid-cols-12 lg:gap-8"
    >
      {/* Khung ảnh: một khung cố định, nội dung lần lượt thay đổi */}
      <div
        className="min-w-0 lg:col-span-7 order-2 lg:order-1"
        onMouseEnter={() => setIsHolding(true)}
        onMouseLeave={() => setIsHolding(false)}
        onFocus={() => setIsHolding(true)}
        onBlur={() => setIsHolding(false)}
      >
        {displayImages.length === 0 ? (
          <div className="bg-paper p-8 sm:p-10 space-y-3">
            <h3 className="text-lead">
              {activeCollectionId === 'all'
                ? 'Chưa có khung hình rời trong bảng `images`'
                : 'Album này chưa có ảnh chi tiết trong bảng `images`'}
            </h3>
            <p className="max-w-[52ch]">
              Ảnh bìa của album vẫn hiển thị trong danh sách bên cạnh. Khi bạn thêm ảnh vào bảng{' '}
              <code>images</code> với <code>collection_id</code> tương ứng, các ảnh thành phần sẽ tự
              động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <figure data-reveal>
            <button
              type="button"
              onClick={() => setIndex((index + 1) % displayImages.length)}
              aria-label="Chuyển sang ảnh tiếp theo"
              className="block w-full cursor-pointer"
            >
              <PhotoStack photos={photos} active={index} className="aspect-[4/3] w-full" />
            </button>

            <figcaption className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{current?.caption || 'Ảnh không tiêu đề'}</p>
                <p className="text-small text-muted mt-1">
                  {current?.is_real_photo === false
                    ? 'Ảnh tham khảo'
                    : `Ảnh chụp thực tế, ${current?.camera_gear || 'Sony A6400'}`}
                  {current?.exif_info && current?.is_real_photo !== false ? `, ${current.exif_info}` : ''}
                  {current?.city ? `. ${current.city}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => current && setSelectedImage(current)}
                className="text-link text-small font-semibold shrink-0 cursor-pointer"
              >
                Xem ảnh lớn
              </button>
            </figcaption>

            {displayImages.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-x-2 gap-y-4" aria-label="Chọn ảnh">
                {displayImages.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={img.caption || `Ảnh ${i + 1}`}
                    aria-pressed={i === index}
                    className="relative shrink-0 w-16 h-16 cursor-pointer group"
                  >
                    <img
                      src={optimizeCloudinaryUrl(img.cloudinary_url)}
                      alt=""
                      loading="lazy"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        i === index ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-0 -bottom-2 h-1 bg-accent transition-transform duration-300 origin-left ${
                        i === index ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </figure>
        )}
      </div>

      {/* Tiêu đề và danh sách album, dùng làm bộ lọc */}
      <div className="min-w-0 lg:col-start-9 lg:col-span-4 order-1 lg:order-2">
        <h2 id="gallery-title" data-reveal className="text-head max-w-[12ch]">
          Kho khung hình Sony A6400
        </h2>
        <p data-reveal style={{ '--d': '80ms' } as React.CSSProperties} className="mt-8 max-w-[40ch]">
          Các album chủ đề ghi lại nhịp sống đô thị và văn hóa truyền thống Nhật Bản chụp bằng máy
          ảnh <strong className="font-semibold">Sony A6400 (lens 18-135mm)</strong>.
        </p>
        <p className="mt-3 text-small text-muted">
          {collections.length} album, {images.length} khung hình đã đồng bộ.
        </p>

        {collections.length > 0 && (
          <ul className="mt-10 space-y-2" aria-label="Lọc theo album">
            <li>
              <button
                type="button"
                onClick={() => selectCollection('all')}
                aria-pressed={activeCollectionId === 'all'}
                className={`w-full text-left px-4 py-3 cursor-pointer transition-colors duration-200 ${
                  activeCollectionId === 'all' ? 'bg-ink text-paper' : 'bg-paper hover:bg-surface'
                }`}
              >
                Tất cả album
              </button>
            </li>
            {collections.map((col, i) => {
              const isSelected = activeCollectionId === col.id;
              const count = col.images?.length || 0;
              return (
                <li
                  key={col.id}
                  data-reveal
                  style={{ '--d': `${120 + i * 70}ms` } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => selectCollection(isSelected ? 'all' : col.id)}
                    aria-pressed={isSelected}
                    className={`w-full text-left flex items-start gap-4 p-2 pr-4 cursor-pointer transition-colors duration-200 ${
                      isSelected ? 'bg-ink text-paper' : 'bg-paper hover:bg-surface'
                    }`}
                  >
                    <img
                      src={col.cover_image ? optimizeCloudinaryUrl(col.cover_image) : FALLBACK_ALBUM_COVER}
                      alt=""
                      loading="lazy"
                      className="w-16 h-16 object-cover shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug">{col.title}</span>
                      <span className={`block text-small ${isSelected ? 'text-paper' : 'text-muted'}`}>
                        {col.location_tag || 'Nhật Bản'}, {count} bức ảnh
                      </span>
                      {col.description && (
                        <span className="block text-small mt-1">{col.description}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {activeCollection && (
          <div className="mt-6 text-small">
            {activeCollection.cover_image && (
              <button
                type="button"
                onClick={() => handleOpenCoverInLightbox(activeCollection)}
                className="text-link font-semibold cursor-pointer"
              >
                Phóng to ảnh bìa
              </button>
            )}
          </div>
        )}
      </div>

      <ImageLightboxModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </section>
  );
}

export default GalleryShowcase;
