'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEvent, GalleryImage } from '@/types/database.type';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { useAuth } from '@/components/auth/AuthContext';
import { TimelineRouteMap } from './TimelineRouteMap';
import { categoryLabel, splitTimeSlot } from '@/lib/tripFormat';
import { PhotoFrame, StickyTag, photoKind, photoTagDetail } from '@/components/ui/PhotoFrame';
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
                    className="w-full aspect-[4/3] object-cover bg-surface"
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

// =========================================================================
// SUB-COMPONENT: TIMELINE GALLERY MODAL (Bàn soi ảnh: xem từng ảnh hoặc tờ ảnh liên hoàn)
// =========================================================================
interface TimelineGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  timeSlot: string;
  city: string;
  dayNumber: number;
  realPhotos: GalleryImage[];
  refPhotos: GalleryImage[];
  initialTab?: GalleryTab;
  initialViewMode?: GalleryMode;
  initialIndex?: number;
  onOpenExternalImage?: (img: GalleryImage) => void;
}

function segmentClass(isActive: boolean) {
  return `min-h-10 px-4 text-small cursor-pointer transition-colors duration-200 ${
    isActive ? 'bg-night-ink text-night font-semibold' : 'bg-white/10 hover:bg-white/20'
  }`;
}

const viewerArrowClass =
  'absolute top-1/2 -translate-y-1/2 z-[3] w-12 h-12 flex items-center justify-center bg-night-ink text-night text-head leading-none cursor-pointer transition-colors duration-200 hover:bg-accent hover:text-accent-ink';

/** Ô vuông màu nhỏ: đỏ cho ảnh thực tế, vàng giấy cho ảnh tham khảo */
function KindMark({ img }: { img: GalleryImage }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-2.5 h-2.5 shrink-0 ${photoKind(img) === 'real' ? 'bg-accent' : 'bg-[var(--note-ref-tag)]'}`}
    />
  );
}

export function TimelineGalleryModal({
  isOpen,
  onClose,
  locationName,
  timeSlot,
  city,
  dayNumber,
  realPhotos,
  refPhotos,
  initialTab = 'real',
  initialViewMode = 'grid',
  initialIndex = 0,
}: TimelineGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<GalleryTab>(() => {
    if (initialTab === 'real' && realPhotos.length > 0) return 'real';
    if (initialTab === 'ref' && refPhotos.length > 0) return 'ref';
    return realPhotos.length > 0 ? 'real' : refPhotos.length > 0 ? 'ref' : 'all';
  });

  const [viewMode, setViewMode] = useState<GalleryMode>(initialViewMode);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const allImages = useMemo(() => [...realPhotos, ...refPhotos], [realPhotos, refPhotos]);

  const currentImageList = useMemo(() => {
    if (activeTab === 'real') return realPhotos;
    if (activeTab === 'ref') return refPhotos;
    return allImages;
  }, [activeTab, realPhotos, refPhotos, allImages]);

  const count = currentImageList.length;
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, count - 1));
  const activeImage = currentImageList[safeIndex];

  const goPrev = () => setCurrentIndex(stepIndex(safeIndex, -1, count));
  const goNext = () => setCurrentIndex(stepIndex(safeIndex, 1, count));
  const swipe = useSwipe(goPrev, goNext);

  const openSingle = (idx: number) => {
    setCurrentIndex(idx);
    setViewMode('lightbox');
  };

  const switchTab = (tab: GalleryTab) => {
    setActiveTab(tab);
    setCurrentIndex(0);
  };

  // Bàn phím: Esc để đóng, mũi tên Trái/Phải để chuyển ảnh khi xem từng ảnh
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (viewMode === 'lightbox' && count > 1) {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex((prev) => stepIndex(Math.min(prev, count - 1), -1, count));
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex((prev) => stepIndex(Math.min(prev, count - 1), 1, count));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, viewMode, count]);

  // Tải trước ảnh kề bên để bấm qua lại không phải chờ
  useEffect(() => {
    if (viewMode !== 'lightbox' || count < 2) return;
    [stepIndex(safeIndex, -1, count), stepIndex(safeIndex, 1, count)].forEach((i) => {
      const pre = new Image();
      pre.src = optimizeCloudinaryUrl(currentImageList[i].cloudinary_url);
    });
  }, [viewMode, safeIndex, count, currentImageList]);

  if (!isOpen) return null;

  const isReal = (img?: GalleryImage) => img?.is_real_photo !== false;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ảnh của ${locationName}`}
      className="fixed inset-0 z-50 flex flex-col bg-night text-night-ink"
    >
      {/* Đầu bàn soi: mốc, chế độ xem, đóng */}
      <header className="frame flex items-center justify-between gap-4 py-4 shrink-0 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-small opacity-70 tabular truncate">
            Ngày {dayNumber} · {splitTimeSlot(timeSlot).start} · {city}
          </p>
          <h3 className="text-lead leading-tight mt-1 line-clamp-2 sm:line-clamp-1">{locationName}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div role="group" aria-label="Chế độ xem" className="hidden sm:flex">
            <button
              type="button"
              onClick={() => setViewMode('lightbox')}
              aria-pressed={viewMode === 'lightbox'}
              className={segmentClass(viewMode === 'lightbox')}
            >
              Từng ảnh
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={segmentClass(viewMode === 'grid')}
            >
              Lưới ảnh
            </button>
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'lightbox' : 'grid')}
            className={`sm:hidden ${segmentClass(false)}`}
          >
            {viewMode === 'grid' ? 'Từng ảnh' : 'Lưới'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 px-4 text-small font-semibold bg-accent text-accent-ink cursor-pointer transition-colors duration-200 hover:bg-accent-deep"
          >
            Đóng<span className="hidden sm:inline"> (Esc)</span>
          </button>
        </div>
      </header>

      {/* Lọc theo loại ảnh, chỉ khi mốc có cả hai loại */}
      {realPhotos.length > 0 && refPhotos.length > 0 && (
        <div role="group" aria-label="Phân loại ảnh" className="frame flex flex-wrap items-center gap-2 py-3 shrink-0">
          <button type="button" onClick={() => switchTab('all')} aria-pressed={activeTab === 'all'} className={segmentClass(activeTab === 'all')}>
            Tất cả <span className="tabular opacity-70">{allImages.length}</span>
          </button>
          <button type="button" onClick={() => switchTab('real')} aria-pressed={activeTab === 'real'} className={`${segmentClass(activeTab === 'real')} inline-flex items-center gap-2`}>
            <span aria-hidden="true" className="w-2.5 h-2.5 bg-accent" />
            Thực tế <span className="tabular opacity-70">{realPhotos.length}</span>
          </button>
          <button type="button" onClick={() => switchTab('ref')} aria-pressed={activeTab === 'ref'} className={`${segmentClass(activeTab === 'ref')} inline-flex items-center gap-2`}>
            <span aria-hidden="true" className="w-2.5 h-2.5 bg-[var(--note-ref-tag)]" />
            Tham khảo <span className="tabular opacity-70">{refPhotos.length}</span>
          </button>
        </div>
      )}

      {/* Tờ ảnh liên hoàn: các bản in giữ tỉ lệ gốc, xếp so le theo cột */}
      {viewMode === 'grid' && (
        <div className="flex-1 overflow-y-auto">
          <div className="frame pt-6 pb-16 columns-2 sm:columns-3 lg:columns-4 gap-5">
            {currentImageList.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => openSingle(idx)}
                className="group block w-full mb-8 break-inside-avoid text-left cursor-zoom-in"
              >
                <PhotoFrame kind={photoKind(img)} small>
                  <span className="block overflow-hidden bg-white/10">
                    <img
                      src={optimizeCloudinaryUrl(img.cloudinary_url)}
                      alt={img.caption || locationName}
                      loading="lazy"
                      className="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </span>
                </PhotoFrame>
                <span className="flex items-baseline gap-2 mt-2 text-small leading-snug">
                  <span className="tabular opacity-60">{pad(idx + 1)}</span>
                  <span className="min-w-0">{img.caption || locationName}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Xem từng ảnh: ảnh lớn bên trái, thẻ thông tin và dải ảnh bên phải */}
      {viewMode === 'lightbox' && activeImage && (
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 py-6 sm:px-20 select-none" {...swipe}>
            <span key={activeImage.id} className="relative inline-block photo-enter">
              <StickyTag kind={photoKind(activeImage)} detail={photoTagDetail(activeImage)} />
              <img
                src={optimizeCloudinaryUrl(activeImage.cloudinary_url)}
                alt={activeImage.caption || locationName}
                className="block max-w-full w-auto object-contain max-h-[calc(100svh-19rem)] lg:max-h-[calc(100svh-11rem)]"
              />
            </span>

            {count > 1 && (
              <>
                <button type="button" onClick={goPrev} aria-label="Ảnh trước đó" className={`${viewerArrowClass} left-3 sm:left-5`}>
                  ‹
                </button>
                <button type="button" onClick={goNext} aria-label="Ảnh kế tiếp" className={`${viewerArrowClass} right-3 sm:right-5`}>
                  ›
                </button>
              </>
            )}
          </div>

          <aside className="shrink-0 lg:min-h-0 lg:overflow-y-auto lg:border-l border-t lg:border-t-0 border-white/10 px-4 py-4 sm:px-6 lg:py-8 flex flex-col gap-5 lg:gap-8">
            <div className="flex items-start justify-between gap-6 lg:block">
              <div className="min-w-0 space-y-1 lg:order-2">
                <p className="flex items-center gap-2 text-small font-semibold">
                  <KindMark img={activeImage} />
                  {isReal(activeImage) ? 'Ảnh chụp thực tế' : 'Ảnh minh họa, tham khảo lịch trình'}
                </p>
                <p className="text-body leading-snug">{activeImage.caption || locationName}</p>
              </div>
              <p className="shrink-0 tabular leading-none lg:mb-6" aria-live="polite">
                <span className="text-lead lg:text-head">{pad(safeIndex + 1)}</span>
                <span className="text-small opacity-60"> / {pad(count)}</span>
              </p>
            </div>

            {/* Thông số: chỉ hiện trên máy tính, điện thoại giữ gọn cho ảnh */}
            <dl className="hidden lg:grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-3 text-small">
              <dt className="opacity-60">{isReal(activeImage) ? 'Máy ảnh' : 'Nguồn'}</dt>
              <dd>{isReal(activeImage) ? activeImage.camera_gear || 'Sony A6400 • 18-135mm OSS' : 'Tư liệu tham khảo web'}</dd>
              {isReal(activeImage) && activeImage.exif_info && (
                <>
                  <dt className="opacity-60">Thông số</dt>
                  <dd className="tabular">{activeImage.exif_info}</dd>
                </>
              )}
              <dt className="opacity-60">Nơi chốn</dt>
              <dd>{activeImage.city || city}</dd>
              {activeImage.taken_at && (
                <>
                  <dt className="opacity-60">Ngày</dt>
                  <dd className="tabular">{activeImage.taken_at}</dd>
                </>
              )}
            </dl>

            {/* Dải ảnh: hàng ngang trên điện thoại, lưới ba cột trên máy tính */}
            {count > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
                {currentImageList.map((thumb, idx) => (
                  <button
                    key={thumb.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={thumb.caption || `Ảnh ${idx + 1}`}
                    aria-pressed={idx === safeIndex}
                    className={`relative w-16 h-16 shrink-0 lg:w-auto lg:h-auto lg:aspect-square cursor-pointer transition-opacity duration-200 ${
                      idx === safeIndex ? 'opacity-100 outline-2 outline-accent outline-offset-2' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={optimizeCloudinaryUrl(thumb.cloudinary_url)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <span className="absolute left-1 bottom-1">
                      <KindMark img={thumb} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="hidden lg:block text-small opacity-50 mt-auto">
              Dùng phím ← → để chuyển ảnh, Esc để đóng.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

export default TimelineItemCard;
