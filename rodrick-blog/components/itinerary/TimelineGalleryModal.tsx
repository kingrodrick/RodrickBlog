'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GalleryImage } from '@/types/database.type';
import type { GalleryMode, GalleryTab } from './TimelineItemCard';
import { cloudinaryThumbUrl, optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { splitTimeSlot } from '@/lib/tripFormat';
import { photoKind } from '@/components/ui/PhotoFrame';
import { PhotoThumbs, stepIndex, useSwipe } from '@/components/ui/PhotoNav';

// =========================================================================
// Bàn soi ảnh của một mốc: xem từng ảnh (phóng to / thu nhỏ, kéo ảnh, bảng thông tin đóng mở,
// hàng ảnh mini hiện khi rê chuột xuống đáy) hoặc lưới ảnh.
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;

const pad = (n: number) => String(n).padStart(2, '0');
const isReal = (img?: GalleryImage) => img?.is_real_photo !== false;

/** Ô vuông màu nhỏ: đỏ cho ảnh thực tế, vàng giấy cho ảnh tham khảo */
function KindMark({ img }: { img: GalleryImage }) {
  return <span aria-hidden="true" className="viewer-kind" data-kind={photoKind(img)} />;
}

/** Biểu tượng nét mảnh dùng trong bàn soi */
function Icon({ name }: { name: 'close' | 'single' | 'grid' | 'info' | 'plus' | 'minus' | 'prev' | 'next' }) {
  const paths: Record<typeof name, React.ReactNode> = {
    close: <path d="M6 6l12 12M18 6L6 18" />,
    single: <rect x="4" y="5" width="16" height="14" rx="1" />,
    grid: (
      <>
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5.5M12 7.6v.4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    prev: <path d="M15 5l-7 7 7 7" />,
    next: <path d="M9 5l7 7-7 7" />,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="viewer-icon">
      {paths[name]}
    </svg>
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
  // Bảng thông tin mở sẵn khi vào bàn soi; bấm "i" để thu
  const [infoOpen, setInfoOpen] = useState(true);
  // Hàng ảnh mini hiện khi chuột di chuyển trong khung ảnh (và lúc mới mở), tự ẩn khi chuột đứng yên
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeTimer = useRef<number | undefined>(undefined);
  const revealChrome = () => {
    setChromeVisible(true);
    window.clearTimeout(chromeTimer.current);
    chromeTimer.current = window.setTimeout(() => setChromeVisible(false), 2500);
  };
  useEffect(() => {
    chromeTimer.current = window.setTimeout(() => setChromeVisible(false), 2500);
    return () => window.clearTimeout(chromeTimer.current);
  }, []);

  const allImages = useMemo(() => [...realPhotos, ...refPhotos], [realPhotos, refPhotos]);
  const currentImageList = useMemo(() => {
    if (activeTab === 'real') return realPhotos;
    if (activeTab === 'ref') return refPhotos;
    return allImages;
  }, [activeTab, realPhotos, refPhotos, allImages]);

  const count = currentImageList.length;
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, count - 1));
  const activeImage = currentImageList[safeIndex];
  const hasBothKinds = realPhotos.length > 0 && refPhotos.length > 0;

  // ---- Phóng to / thu nhỏ và kéo ảnh ----
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Đổi ảnh: về cỡ gốc (điều chỉnh state ngay khi render)
  const imageKey = activeImage ? `${activeTab}-${activeImage.id}` : '';
  const [prevImageKey, setPrevImageKey] = useState(imageKey);
  if (imageKey !== prevImageKey) {
    setPrevImageKey(imageKey);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  /** Giới hạn kéo để mép ảnh không trôi vào giữa khung */
  const clampPan = (p: { x: number; y: number }, z: number) => {
    const img = imgRef.current;
    if (!img || z <= 1) return { x: 0, y: 0 };
    const mx = ((z - 1) * img.offsetWidth) / 2;
    const my = ((z - 1) * img.offsetHeight) / 2;
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
  };

  const zoomTo = (next: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    const old = zoom;
    setZoom(z);
    // Giữ điểm đang xem ở giữa khi đổi mức phóng
    setPan((p) => clampPan({ x: (p.x * z) / old, y: (p.y * z) / old }, z));
  };
  const zoomBy = (factor: number) => zoomTo(zoom * factor);

  // Cuộn chuột trong khung ảnh để phóng to / thu nhỏ (chặn cuộn trang nền)
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  });
  useEffect(() => {
    const el = stageRef.current;
    if (!el || viewMode !== 'lightbox') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      const old = zoomRef.current;
      zoomRef.current = z;
      setZoom(z);
      setPan((p) => clampPan({ x: (p.x * z) / old, y: (p.y * z) / old }, z));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewMode]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1 || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragStart.current;
    if (!s) return;
    setPan(clampPan({ x: s.px + e.clientX - s.x, y: s.py + e.clientY - s.y }, zoom));
  };
  const onPointerUp = () => {
    dragStart.current = null;
    setDragging(false);
  };

  // ---- Chuyển ảnh ----
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

  // Bàn phím: Esc đóng; khi xem từng ảnh: ← → chuyển ảnh, + − 0 phóng to / thu nhỏ / về cỡ gốc, i bật thông tin
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (viewMode !== 'lightbox') return;
      if (count > 1 && e.key === 'ArrowLeft') setCurrentIndex((prev) => stepIndex(Math.min(prev, count - 1), -1, count));
      else if (count > 1 && e.key === 'ArrowRight') setCurrentIndex((prev) => stepIndex(Math.min(prev, count - 1), 1, count));
      else if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP);
      else if (e.key === '-' || e.key === '_') zoomBy(1 / ZOOM_STEP);
      else if (e.key === '0') zoomTo(1);
      else if (e.key === 'i' || e.key === 'I') setInfoOpen((o) => !o);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  });

  // Tải trước ảnh kề bên để bấm qua lại không phải chờ
  useEffect(() => {
    if (viewMode !== 'lightbox' || count < 2) return;
    [stepIndex(safeIndex, -1, count), stepIndex(safeIndex, 1, count)].forEach((i) => {
      const pre = new Image();
      pre.src = optimizeCloudinaryUrl(currentImageList[i].cloudinary_url);
    });
  }, [viewMode, safeIndex, count, currentImageList]);

  if (!isOpen) return null;

  const tabs: { id: GalleryTab; label: string; n: number }[] = [
    { id: 'all', label: 'Tất cả', n: allImages.length },
    { id: 'real', label: 'Thực tế', n: realPhotos.length },
    { id: 'ref', label: 'Tham khảo', n: refPhotos.length },
  ];

  // Lưới: khi xem "Tất cả" thì chia hai nhóm thực tế / tham khảo; chỉ số tính trong danh sách đang xem
  const gridSections =
    activeTab === 'all' && hasBothKinds
      ? [
          { title: 'Ảnh chụp thực tế', photos: realPhotos, offset: 0 },
          { title: 'Ảnh tham khảo', photos: refPhotos, offset: realPhotos.length },
        ]
      : [{ title: null, photos: currentImageList, offset: 0 }];

  return (
    <div role="dialog" aria-modal="true" aria-label={`Ảnh của ${locationName}`} className="viewer">
      {/* Đầu bàn soi: mốc, lọc loại ảnh, chế độ xem, đóng */}
      <header className="viewer-bar">
        <div className="min-w-0">
          <p className="text-small opacity-60 tabular truncate">
            Ngày {dayNumber} · {splitTimeSlot(timeSlot).start} · {city}
          </p>
          <h3 className="mt-0.5 font-semibold leading-tight truncate">{locationName}</h3>
        </div>

        {hasBothKinds && (
          <div role="group" aria-label="Phân loại ảnh" className="viewer-filter">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                aria-pressed={activeTab === t.id}
                data-kind={t.id}
              >
                {t.id !== 'all' && <span aria-hidden="true" className="viewer-kind" data-kind={t.id} />}
                {t.label}
                <span className="tabular opacity-60">{t.n}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('lightbox')}
            aria-pressed={viewMode === 'lightbox'}
            aria-label="Xem từng ảnh"
            title="Xem từng ảnh"
            className="viewer-btn"
          >
            <Icon name="single" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            aria-label="Xem lưới ảnh"
            title="Xem lưới ảnh"
            className="viewer-btn"
          >
            <Icon name="grid" />
          </button>
          <span aria-hidden="true" className="w-px h-5 mx-1.5 bg-white/15" />
          <button type="button" onClick={onClose} aria-label="Đóng (Esc)" title="Đóng (Esc)" className="viewer-btn">
            <Icon name="close" />
          </button>
        </div>
      </header>

      {/* ---------------- Lưới ảnh ---------------- */}
      {viewMode === 'grid' && (
        <div className="flex-1 overflow-y-auto">
          <div className="frame py-8 lg:py-10 space-y-10">
            {gridSections.map((section) => (
              <section key={section.title ?? 'all'}>
                {section.title && (
                  <h4 className="viewer-section-title">
                    <span aria-hidden="true" className="viewer-kind" data-kind={section.offset === 0 ? 'real' : 'ref'} />
                    {section.title}
                    <span className="tabular opacity-50">{pad(section.photos.length)}</span>
                  </h4>
                )}
                <div className="viewer-grid">
                  {section.photos.map((img, k) => {
                    const idx = section.offset + k;
                    return (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => openSingle(idx)}
                        aria-current={idx === safeIndex ? 'true' : undefined}
                        className="viewer-tile group"
                      >
                        <span className="viewer-tile-img">
                          <img src={cloudinaryThumbUrl(img.cloudinary_url, 640, 480)} alt="" loading="lazy" decoding="async" />
                        </span>
                        <span className="viewer-tile-caption">
                          <span className="tabular opacity-50">{pad(idx + 1)}</span>
                          <KindMark img={img} />
                          <span className="min-w-0 truncate">{img.caption || locationName}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Từng ảnh ---------------- */}
      {viewMode === 'lightbox' && activeImage && (
        <div
          ref={stageRef}
          className="viewer-stage"
          data-info={infoOpen}
          data-zoomed={zoom > 1}
          data-dragging={dragging}
          data-chrome={chromeVisible}
          onMouseMove={revealChrome}
          {...(zoom <= 1 ? swipe : {})}
        >
          <div
            className="viewer-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={() => zoomTo(zoom > 1 ? 1 : 2)}
          >
            <img
              ref={imgRef}
              key={imageKey}
              src={optimizeCloudinaryUrl(activeImage.cloudinary_url)}
              alt={activeImage.caption || locationName}
              draggable={false}
              className="viewer-img photo-enter"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          </div>

          {/* Góc trên trái: vị trí ảnh và loại ảnh */}
          <p className="viewer-counter" aria-live="polite">
            <span className="tabular">
              {pad(safeIndex + 1)}
              <span className="opacity-50"> / {pad(count)}</span>
            </span>
            <span className="viewer-counter-kind">
              <KindMark img={activeImage} />
              {isReal(activeImage) ? 'Ảnh thực tế' : 'Ảnh tham khảo'}
            </span>
          </p>

          {/* Góc trên phải: phóng to / thu nhỏ và nút thông tin */}
          <div className="viewer-tools">
            <div className="viewer-zoom" role="group" aria-label="Phóng to / thu nhỏ">
              <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} aria-label="Thu nhỏ (−)">
                <Icon name="minus" />
              </button>
              <button type="button" onClick={() => zoomTo(1)} aria-label="Về cỡ gốc (0)" className="tabular">
                {Math.round(zoom * 100)}%
              </button>
              <button type="button" onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} aria-label="Phóng to (+)">
                <Icon name="plus" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              aria-expanded={infoOpen}
              aria-label={infoOpen ? 'Ẩn thông tin ảnh (i)' : 'Xem thông tin ảnh (i)'}
              className="viewer-btn"
              data-active={infoOpen}
            >
              <Icon name="info" />
            </button>
          </div>

          {count > 1 && (
            <>
              <button type="button" onClick={goPrev} aria-label="Ảnh trước đó (←)" className="viewer-btn viewer-nav" data-side="prev">
                <Icon name="prev" />
              </button>
              <button type="button" onClick={goNext} aria-label="Ảnh kế tiếp (→)" className="viewer-btn viewer-nav" data-side="next">
                <Icon name="next" />
              </button>
            </>
          )}

          {/* Bảng thông tin ảnh: trượt vào từ bên phải, bật tắt bằng nút "i" */}
          <aside className="viewer-info" aria-hidden={!infoOpen} inert={!infoOpen}>
            <p className="flex items-center gap-2 text-small font-semibold">
              <KindMark img={activeImage} />
              {isReal(activeImage) ? 'Ảnh chụp thực tế' : 'Ảnh minh họa, tham khảo lịch trình'}
            </p>
            <p className="mt-2 text-lead leading-snug">{activeImage.caption || locationName}</p>
            <dl className="mt-8 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3 text-small">
              <dt className="opacity-55">{isReal(activeImage) ? 'Máy ảnh' : 'Nguồn'}</dt>
              <dd>{isReal(activeImage) ? activeImage.camera_gear || 'Sony A6400 • 18-135mm OSS' : 'Tư liệu tham khảo web'}</dd>
              {isReal(activeImage) && activeImage.exif_info && (
                <>
                  <dt className="opacity-55">Thông số</dt>
                  <dd className="tabular">{activeImage.exif_info}</dd>
                </>
              )}
              <dt className="opacity-55">Nơi chốn</dt>
              <dd>{activeImage.city || city}</dd>
              {activeImage.taken_at && (
                <>
                  <dt className="opacity-55">Ngày</dt>
                  <dd className="tabular">{activeImage.taken_at}</dd>
                </>
              )}
            </dl>
            <p className="mt-auto pt-8 text-small opacity-45 leading-relaxed">
              ← → chuyển ảnh · cuộn chuột hoặc + − để phóng to, thu nhỏ · bấm đúp để phóng to nhanh · i bật tắt bảng
              này · Esc để đóng.
            </p>
          </aside>

          {/* Hàng ảnh mini ở đáy: hiện khi di chuột trong khung ảnh hoặc rê xuống đáy, kể cả khi chỉ có một ảnh */}
          {count > 0 && (
            <div className="viewer-thumbs">
              <PhotoThumbs
                key={activeTab}
                allowSingle
                photos={currentImageList.map((img) => ({
                  key: img.id,
                  src: cloudinaryThumbUrl(img.cloudinary_url),
                  alt: img.caption || locationName,
                }))}
                index={safeIndex}
                onPick={setCurrentIndex}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TimelineGalleryModal;
