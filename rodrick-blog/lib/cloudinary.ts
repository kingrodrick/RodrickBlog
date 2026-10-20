/**
 * Cloudinary Helpers & Upload Service
 */

let lastTimestamp = 0;

/**
 * Tạo định danh public_id theo timestamp tại thời điểm tải ảnh lên
 * Đảm bảo tính duy nhất và tăng dần ngay cả khi tải nhiều ảnh trong cùng một mili-giây
 * Ví dụ: 1740001234567
 */
export function generateTimestampId(): string {
  let now = Date.now();
  if (now <= lastTimestamp) {
    now = lastTimestamp + 1;
  }
  lastTimestamp = now;
  return `${now}`;
}

export const generateBase64TimestampId = generateTimestampId;

/**
 * Chuẩn hóa tên chuyến đi thành tên thư mục an toàn trên Cloudinary
 * Ví dụ: "Chuyến Đi Nhật Bản (Tháng 12/2026)" -> "nhat-ban-thang-12-2026"
 */
export function slugifyFolderName(name?: string): string {
  if (!name || !name.trim()) return 'trip-default';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'trip-default';
}

/**
 * Tạo đường dẫn thư mục phân cấp trên Cloudinary theo cấu trúc:
 * [tripFolder]/Timelines/[tripDate]/[ThamKhao | ThucTe]
 *
 * @param tripSlugOrTitle Slug hoặc Tên chuyến đi (ví dụ: 'nhat-ban-2026')
 * @param tripDate Ngày thực tế trên timeline (ví dụ: '2026-12-11')
 * @param isRealPhoto true = 'ThucTe' (ảnh chụp thật) | false = 'ThamKhao' (ảnh tham khảo web)
 */
export function buildCloudinaryTimelineFolder(
  tripSlugOrTitle?: string,
  tripDate?: string,
  isRealPhoto = true
): string {
  const tripFolder = slugifyFolderName(tripSlugOrTitle || 'general-trip');
  const dateFolder = tripDate && tripDate.trim() ? tripDate.trim() : 'Chung';
  const categoryFolder = isRealPhoto ? 'ThucTe' : 'ThamKhao';
  return `${tripFolder}/Timelines/${dateFolder}/${categoryFolder}`;
}

/**
 * Tối ưu hóa URL ảnh Cloudinary
 * Tự động chèn f_auto,q_auto để tối ưu định dạng và dung lượng ảnh tải về
 */
export function optimizeCloudinaryUrl(url: string): string {
  if (!url || !url.includes('/image/upload/')) {
    return url;
  }
  if (url.includes('/image/upload/f_auto,q_auto/')) {
    return url;
  }
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
}

/**
 * Tải file ảnh trực tiếp lên Cloudinary sử dụng Unsigned Upload Preset
 * Đặt tên file bằng timestamp tải ảnh lên
 * @param file File ảnh hoặc Blob từ máy tính / Clipboard
 * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: 'rodrick-blog/timeline')
 * @param customPublicId Tùy chọn đặt tên public_id thủ công (mặc định: timestamp Date.now())
 * @returns Promise<string> URL bảo mật (secure_url) từ Cloudinary
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder = 'rodrick-blog/timeline',
  customPublicId?: string
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Chưa cấu hình Cloudinary trong .env.local (Cần NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)'
    );
  }

  // Đặt tên public_id và tên hiển thị trên Cloudinary (display_name / name) theo timestamp
  const publicId = customPublicId || generateTimestampId();

  // Xác định đuôi file (jpg, png, webp,...)
  const extension =
    (file as File).name?.split('.').pop()?.toLowerCase() ||
    file.type?.split('/')[1]?.replace('jpeg', 'jpg') ||
    'jpg';
  const filenameWithExt = `${publicId}.${extension}`;

  const formData = new FormData();
  // Đặt tên file truyền vào form là timestamp để Cloudinary ghi nhận original_filename là timestamp
  formData.append('file', file, filenameWithExt);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', publicId);
  formData.append('filename_override', publicId);
  if (folder) {
    formData.append('folder', folder);
    formData.append('asset_folder', folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  let errorMsg = `Lỗi khi tải ảnh lên Cloudinary (HTTP ${response.status})`;
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    errorMsg = errorData?.error?.message || errorMsg;

    // Thử tải qua API route nếu server đã cấu hình API Key & Secret
    try {
      const serverFormData = new FormData();
      serverFormData.append('file', file, filenameWithExt);
      serverFormData.append('folder', folder);
      serverFormData.append('public_id', publicId);
      const serverRes = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: serverFormData,
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.secure_url) {
          return serverData.secure_url;
        }
      }
    } catch {
      // Bỏ qua lỗi fallback
    }

    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Gửi yêu cầu xóa ảnh cũ trên Cloudinary thông qua API route
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return false;
  }

  try {
    const res = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Không thể gửi yêu cầu xóa ảnh Cloudinary:', err);
    return false;
  }
}
