import {
  buildTimelineFolder,
  LocalImage,
  uploadRemoteToCloudinary,
  uploadToCloudinary,
} from '../../shared/api/cloudinary';
import { DetailEvent } from './types';

/** Ảnh đã chọn nhưng chưa tải lên: từ thư viện máy (local) hoặc từ một địa chỉ ảnh bên ngoài (remoteUrl). */
export type PendingPhoto = {
  key: string;
  previewUri: string;
  local?: LocalImage;
  remoteUrl?: string;
  /** Trang/ảnh nguồn để truy nguồn sau này. */
  sourceUrl?: string;
};

let seq = 0;
const nextKey = () => `p${Date.now()}-${seq++}`;

export const fromLocal = (img: LocalImage): PendingPhoto => ({ key: nextKey(), previewUri: img.uri, local: img });

export const fromRemote = (remoteUrl: string, sourceUrl?: string): PendingPhoto => ({
  key: nextKey(),
  previewUri: remoteUrl,
  remoteUrl,
  sourceUrl: sourceUrl ?? remoteUrl,
});

/** Thư mục Cloudinary giống bản web: [chuyến]/Timelines/[ngày]/[ThucTe | ThamKhao]. */
export const photoFolder = (tripTitle: string, event: DetailEvent, isReal: boolean) =>
  buildTimelineFolder(tripTitle, event.trip_date, isReal);

/** Tải một ảnh lên Cloudinary, trả secure_url. */
export function uploadPending(p: PendingPhoto, folder: string): Promise<string> {
  if (p.local) {
    return uploadToCloudinary(p.local, folder);
  }
  if (p.remoteUrl) {
    return uploadRemoteToCloudinary(p.remoteUrl, folder);
  }
  return Promise.reject(new Error('Ảnh không có nguồn.'));
}

/**
 * Pinterest: địa chỉ ảnh trong trang là bản nhỏ (/236x/, /474x/...). Đổi sang /736x/ để lấy ảnh lớn hơn
 * (bản này có sẵn cho mọi ghim). Địa chỉ khác giữ nguyên.
 */
export function upgradePinterestUrl(url: string): string {
  if (!/^https?:\/\/i\.pinimg\.com\//i.test(url)) {
    return url;
  }
  return url.replace(/^(https?:\/\/i\.pinimg\.com)\/(\d+x\d*|\d+x)\//i, '$1/736x/');
}

/** Địa chỉ ảnh hợp lệ để nhờ Cloudinary tải về: http(s), không có thông tin đăng nhập trong địa chỉ. */
export function parseImageUrl(input: string): string | null {
  const text = input.trim();
  const m = /^https?:\/\/([^/?#\s]+)[^\s]*$/i.exec(text);
  if (!m || m[1].includes('@')) {
    return null;
  }
  return text;
}

export const hostOf = (url: string): string => /^https?:\/\/([^/?#]+)/i.exec(url)?.[1] ?? url;
