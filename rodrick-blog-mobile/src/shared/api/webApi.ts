import { WEB_API_BASE_URL } from './config';

/**
 * Xoá file ảnh trên Cloudinary qua route của web (khoá bí mật nằm ở server, không đưa vào app).
 * Trả true khi route trả về thành công. Không ném lỗi: người gọi vẫn tiếp tục xoá dòng DB.
 */
export async function deleteCloudinaryImage(url: string): Promise<boolean> {
  if (!WEB_API_BASE_URL || !url.includes('cloudinary.com')) {
    return false;
  }
  try {
    const res = await fetch(`${WEB_API_BASE_URL}/api/cloudinary/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      return false;
    }
    const body = (await res.json().catch(() => null)) as { success?: boolean; result?: { result?: string } } | null;
    // Route trả success:true cả khi thiếu khoá bí mật; chỉ coi là đã xoá khi Cloudinary báo ok/not found.
    const r = body?.result?.result;
    return !!body?.success && (r === 'ok' || r === 'not found');
  } catch {
    return false;
  }
}
