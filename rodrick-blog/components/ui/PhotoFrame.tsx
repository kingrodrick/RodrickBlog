import React from 'react';
import { GalleryImage } from '@/types/database.type';

export type PhotoKind = 'real' | 'ref';

export function photoKind(img?: GalleryImage | null): PhotoKind {
  return img?.is_real_photo === false ? 'ref' : 'real';
}

/** Dòng phụ ngắn trên giấy nhớ: chỉ tên máy (bỏ ống kính, thông số sau dấu •) hoặc "Tư liệu web" */
export function photoTagDetail(img?: GalleryImage | null): string {
  if (photoKind(img) === 'ref') return 'Tư liệu web';
  return (img?.camera_gear || 'Sony A6400').split('•')[0].trim();
}

interface StickyTagProps {
  kind: PhotoKind;
  /** Dòng phụ dưới nhãn, ví dụ máy ảnh; bỏ trống ở bản nhỏ */
  detail?: string | null;
  small?: boolean;
}

/** Tờ giấy nhớ dán lệch lên góc ảnh, cho biết ảnh thực tế hay ảnh tham khảo */
export function StickyTag({ kind, detail, small }: StickyTagProps) {
  return (
    <span data-kind={kind} className={`sticky-tag ${small ? 'sticky-tag-sm' : ''}`}>
      <span className="block font-semibold">{kind === 'real' ? 'Ảnh thực tế' : 'Ảnh tham khảo'}</span>
      {!small && detail && <span className="block mt-0.5 opacity-85">{detail}</span>}
    </span>
  );
}

interface PhotoFrameProps {
  kind: PhotoKind;
  detail?: string | null;
  small?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Khung ảnh: bản in giấy trắng cho ảnh thực tế, mẩu cắt giấy vàng cho ảnh tham khảo, kèm giấy nhớ */
export function PhotoFrame({ kind, detail, small, className = '', children }: PhotoFrameProps) {
  // Khung tự định vị (relative) trừ khi nơi dùng đã đặt absolute
  const position = /\babsolute\b/.test(className) ? '' : 'relative';
  return (
    <span data-kind={kind} className={`photo-frame ${position} ${small ? 'photo-frame-sm' : ''} ${className}`}>
      <StickyTag kind={kind} detail={detail} small={small} />
      {children}
    </span>
  );
}

export default PhotoFrame;
