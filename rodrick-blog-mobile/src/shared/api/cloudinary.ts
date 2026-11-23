import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './config';

/**
 * Tải ảnh lên Cloudinary bằng Unsigned Upload Preset, cùng quy ước với lib/cloudinary.ts bản web.
 * Không dùng API Key/Secret trong app: xoá ảnh phải đi qua route server của web.
 */

let lastTimestamp = 0;

/** public_id theo timestamp, tăng dần kể cả khi tải nhiều ảnh trong cùng một mili-giây. */
export function generateTimestampId(): string {
  let now = Date.now();
  if (now <= lastTimestamp) {
    now = lastTimestamp + 1;
  }
  lastTimestamp = now;
  return `${now}`;
}

/** "Chuyến Đi Nhật Bản (Tháng 12/2026)" -> "chuyen-di-nhat-ban-thang-12-2026" */
export function slugifyFolderName(name?: string): string {
  if (!name || !name.trim()) {
    return 'trip-default';
  }
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'trip-default'
  );
}

/** [trip]/Timelines/[yyyy-mm-dd | Chung]/[ThucTe | ThamKhao] */
export function buildTimelineFolder(
  tripSlugOrTitle?: string,
  tripDate?: string,
  isRealPhoto = true,
): string {
  const trip = slugifyFolderName(tripSlugOrTitle || 'general-trip');
  const date = tripDate && tripDate.trim() ? tripDate.trim() : 'Chung';
  return `${trip}/Timelines/${date}/${isRealPhoto ? 'ThucTe' : 'ThamKhao'}`;
}

/** Tệp ảnh trên máy, ví dụ lấy từ thư viện chọn ảnh. */
export type LocalImage = {
  uri: string; // file://... hoặc content://...
  mimeType?: string; // image/jpeg
};

/** Tải ảnh lên và trả về secure_url. */
export async function uploadToCloudinary(
  image: LocalImage,
  folder = 'rodrick-blog/timeline',
): Promise<string> {
  const publicId = generateTimestampId();
  const type = image.mimeType || 'image/jpeg';
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

  // React Native gửi tệp qua FormData bằng object { uri, type, name }.
  const file = {
    uri: image.uri,
    type,
    name: `${publicId}.${ext}`,
  } as unknown as Blob;
  return postUpload(file, publicId, folder);
}

/**
 * Nhờ Cloudinary tự tải ảnh từ một địa chỉ ảnh công khai (dùng cho ảnh lấy từ Pinterest/Google).
 * App không tải ảnh về máy; Cloudinary lưu bản sao nên ảnh không hết hạn như link gốc.
 */
export async function uploadRemoteToCloudinary(
  imageUrl: string,
  folder = 'rodrick-blog/timeline',
): Promise<string> {
  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new Error('Địa chỉ ảnh không hợp lệ.');
  }
  return postUpload(imageUrl, generateTimestampId(), folder);
}

async function postUpload(file: string | Blob, publicId: string, folder: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Chưa cấu hình Cloudinary trong src/shared/api/config.ts.');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  form.append('public_id', publicId);
  form.append('filename_override', publicId);
  form.append('folder', folder);
  form.append('asset_folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    throw new Error(
      data?.error?.message ??
        `Lỗi tải ảnh lên Cloudinary (HTTP ${res.status}).`,
    );
  }
  return data.secure_url as string;
}
