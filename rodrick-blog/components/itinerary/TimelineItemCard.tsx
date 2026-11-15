'use client';

import React, { useState, useMemo } from 'react';
import { TimelineEvent, GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { useAuth } from '@/components/auth/AuthContext';
import { TimelineRouteMap } from './TimelineRouteMap';
import { categoryLabel, splitTimeSlot } from '@/lib/tripFormat';
import { PhotoFrame, photoKind, photoTagDetail } from '@/components/ui/PhotoFrame';
import { PhotoNav, stepIndex, useSwipe } from '@/components/ui/PhotoNav';

export type GalleryTab = 'real' | 'ref' | 'all';
export type GalleryMode = 'grid' | 'lightbox';

/** Ảnh chụp thực tế (Sony A6400) và ảnh tham khảo của một mốc, ảnh nổi bật lên trước */
export function splitEventPhotos(images: GalleryImage[] = []) {
  const byFeatured = (a: GalleryImage, b: GalleryImage) =>
    (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  return {
    realPhotos: images.filter((img) => img.is_real_photo !== false).sort(byFeatured),
    refPhotos: images.filter((img) => img.is_real_photo === false).sort(byFeatured),
  };
}

/** Vị trí trong danh sách gộp (thực tế rồi tham khảo) -> tab và chỉ số tương ứng trong hộp ảnh */
export function galleryTarget(realPhotos: GalleryImage[], flatIndex: number): { tab: GalleryTab; index: number } {
  return flatIndex < realPhotos.length
    ? { tab: 'real', index: flatIndex }
    : { tab: 'ref', index: flatIndex - realPhotos.length };
}

interface TimelineItemCardProps {
  item: TimelineEvent;
  index?: number;
  isActive?: boolean;
  onActivate?: (item: TimelineEvent) => void;
  onOpenGallery?: (item: TimelineEvent, tab: GalleryTab, mode: GalleryMode, index?: number) => void;
  onOpenImage?: (image: GalleryImage) => void;
  onEdit?: (item: TimelineEvent) => void;
}

/** Một mốc trên thời gian biểu: giờ bắt đầu cỡ lớn, địa điểm, ghi chú; ảnh và bản đồ nằm trong dòng trên điện thoại */
export function TimelineItemCard({
  item,
  isActive = false,
  onActivate,
  onOpenGallery,
  onEdit,
}: TimelineItemCardProps) {
  const { isLoggedIn } = useAuth();
  const [showMap, setShowMap] = useState(false);

  const { realPhotos, refPhotos } = useMemo(() => splitEventPhotos(item.images), [item.images]);
  // Ảnh trong dòng: lướt qua toàn bộ ảnh của mốc, ảnh thực tế trước rồi đến ảnh tham khảo
  const allPhotos = useMemo(() => [...realPhotos, ...refPhotos], [realPhotos, refPhotos]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const shownPhoto = allPhotos[Math.min(photoIdx, allPhotos.length - 1)];
  const swipe = useSwipe(
    () => setPhotoIdx((i) => stepIndex(i, -1, allPhotos.length)),
    () => setPhotoIdx((i) => stepIndex(i, 1, allPhotos.length))
  );
  const hasMap = !!item.map_embed_url && item.map_embed_url.trim().length > 0;
  const { start, rest, end, endNote, duration } = splitTimeSlot(item.time_slot);

  return (
    <article
      id={`moc-${item.id}`}
      data-event-id={item.id}
      onMouseEnter={() => onActivate?.(item)}
      onFocus={() => onActivate?.(item)}
      className={`scroll-mt-24 grid gap-x-8 gap-y-3 sm:grid-cols-[11.5rem_1fr] lg:grid-cols-1 xl:grid-cols-[11.5rem_1fr] p-5 sm:p-7 transition-colors duration-300 ${
        isActive ? 'bg-paper' : ''
      }`}
    >
      {/* Khung giờ: bắt đầu và kết thúc cùng cỡ chữ, nằm ngang trên một hàng, nối bằng gạch ngắn */}
      <div>
        <p className="flex items-center gap-2 whitespace-nowrap text-lead leading-none tabular font-semibold">
          <time className={`transition-colors duration-300 ${isActive ? 'text-accent' : ''}`}>{start}</time>
          {end && (
            <>
              <span className="sr-only">đến</span>
              <span
                aria-hidden="true"
                className={`block w-3 h-px shrink-0 transition-colors duration-300 ${
                  isActive ? 'bg-accent' : 'bg-muted/50'
                }`}
              />
              <time className="text-muted">{end}</time>
            </>
          )}
        </p>
        {end ? (
          (duration || endNote) && (
            <p className="mt-2 text-small text-muted tabular">
              {[duration, endNote && `kết thúc ${endNote}`].filter(Boolean).join(' · ')}
            </p>
          )
        ) : (
          rest && <p className="mt-2 text-small text-muted tabular">{rest}</p>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-small text-muted">
          {categoryLabel(item.category_tag)} · {item.city}
        </p>
        <h4 className="mt-1 text-lead leading-tight">{item.location_name}</h4>

        {item.notes && <p className="mt-4 whitespace-pre-line max-w-[60ch]">{item.notes}</p>}

        {/* Ảnh ngay trong dòng (điện thoại và máy tính bảng) */}
        {shownPhoto && (
          <figure className="lg:hidden mt-6">
            <PhotoFrame kind={photoKind(shownPhoto)} detail={photoTagDetail(shownPhoto)}>
              <span className="relative block" {...swipe}>
                <button
                  type="button"
                  onClick={() => {
                    const { tab, index } = galleryTarget(realPhotos, photoIdx);
                    onOpenGallery?.(item, tab, 'lightbox', index);
                  }}
                  className="block w-full cursor-zoom-in"
                  aria-label={`Phóng to ảnh của ${item.location_name}`}
                >
                  <img
                    src={optimizeCloudinaryUrl(shownPhoto.cloudinary_url)}
                    alt={shownPhoto.caption || item.location_name}
                    loading="lazy"
                    className="block w-full h-auto bg-surface"
                  />
                </button>
                <PhotoNav
                  index={photoIdx}
                  count={allPhotos.length}
                  onPrev={() => setPhotoIdx((i) => stepIndex(i, -1, allPhotos.length))}
                  onNext={() => setPhotoIdx((i) => stepIndex(i, 1, allPhotos.length))}
                />
              </span>
            </PhotoFrame>
            <figcaption className="mt-3 text-small text-muted">
              {shownPhoto.caption ||
                (photoKind(shownPhoto) === 'real'
                  ? shownPhoto.camera_gear || 'Sony A6400 • 18-135mm'
                  : 'Ảnh minh họa cho kế hoạch')}
            </figcaption>
          </figure>
        )}

        {hasMap && showMap && (
          <div className="lg:hidden mt-6 h-[340px]">
            <TimelineRouteMap
              map_embed_url={item.map_embed_url}
              locationName={item.location_name}
              city={item.city}
            />
          </div>
        )}

        {/* Hành động: mở tệp ảnh, bản đồ, chỉnh sửa */}
        {(realPhotos.length > 0 || refPhotos.length > 0 || hasMap || (isLoggedIn && onEdit)) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-small">
            {realPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenGallery?.(item, 'real', realPhotos.length > 1 ? 'grid' : 'lightbox')}
                className="text-link font-semibold cursor-pointer"
              >
                {realPhotos.length} ảnh chụp thực tế
              </button>
            )}
            {refPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenGallery?.(item, 'ref', refPhotos.length > 1 ? 'grid' : 'lightbox')}
                className="text-link font-semibold cursor-pointer"
              >
                {refPhotos.length} ảnh tham khảo
              </button>
            )}
            {hasMap && (
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                aria-expanded={showMap}
                className="lg:hidden text-link font-semibold cursor-pointer"
              >
                {showMap ? 'Ẩn tuyến đường' : 'Xem tuyến đường'}
              </button>
            )}
            {isLoggedIn && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="text-link font-semibold text-accent cursor-pointer"
                title="Chỉnh sửa thông tin và hình ảnh sự kiện này"
              >
                Sửa mốc này
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// Bàn soi ảnh của một mốc nằm ở file riêng; xuất lại để các nơi đang import từ đây vẫn dùng được
export { TimelineGalleryModal } from './TimelineGalleryModal';

export default TimelineItemCard;
