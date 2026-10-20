import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, message: 'Server chưa cấu hình CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET trong .env.local' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string) || 'rodrick-blog/timeline';

    if (!file) {
      return NextResponse.json({ success: false, message: 'Thiếu file ảnh' }, { status: 400 });
    }

    const publicId = (formData.get('public_id') as string) || `${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign: Record<string, string> = {
      asset_folder: folder,
      display_name: publicId,
      filename_override: publicId,
      folder,
      public_id: publicId,
      timestamp,
    };

    const sortedKeys = Object.keys(paramsToSign).sort();
    const stringToSign = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp);
    uploadFormData.append('folder', folder);
    uploadFormData.append('asset_folder', folder);
    uploadFormData.append('public_id', publicId);
    uploadFormData.append('display_name', publicId);
    uploadFormData.append('filename_override', publicId);
    uploadFormData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadFormData,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data?.error?.message }, { status: res.status });
    }

    return NextResponse.json({ success: true, secure_url: data.secure_url });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
