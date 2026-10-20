import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
      return NextResponse.json({ success: false, message: 'Invalid URL' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      // Nếu chưa cấu hình API Secret trong .env.local, bỏ qua việc xóa trên Cloudinary CDN
      return NextResponse.json({
        success: true,
        message: 'Cloudinary API Secret chưa cấu hình trong .env.local, bỏ qua xóa CDN.',
      });
    }

    // Trích xuất public_id từ URL Cloudinary (loại bỏ transformation f_auto,q_auto, version v123 và extension)
    const cleanUrl = url.split('?')[0];
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) {
      return NextResponse.json({ success: false, message: 'URL không đúng định dạng Cloudinary' }, { status: 400 });
    }

    let afterUpload = cleanUrl.substring(uploadIndex + '/upload/'.length);

    // Loại bỏ các segment transformation (ví dụ: f_auto,q_auto/ hoặc c_scale,w_500/)
    while (afterUpload.includes('/')) {
      const firstSegment = afterUpload.split('/')[0];
      if (firstSegment.match(/^v\d+$/)) {
        afterUpload = afterUpload.substring(firstSegment.length + 1);
        break;
      } else if (firstSegment.includes(',') || firstSegment.match(/^[a-z]_[a-z0-9_-]+$/i)) {
        afterUpload = afterUpload.substring(firstSegment.length + 1);
      } else {
        break;
      }
    }

    // Loại bỏ phần mở rộng file (.png, .jpg, .webp)
    const lastDotIndex = afterUpload.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      afterUpload = afterUpload.substring(0, lastDotIndex);
    }

    const publicId = afterUpload;
    if (!publicId) {
      return NextResponse.json({ success: false, message: 'Không thể trích xuất public_id' }, { status: 400 });
    }
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Tạo chữ ký SHA-1 theo chuẩn Cloudinary Destroy API
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Lỗi khi xóa ảnh Cloudinary:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
