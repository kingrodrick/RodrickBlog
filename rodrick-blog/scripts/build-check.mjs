// Build production sạch để bắt lỗi biên dịch và cấu hình route (bước cuối của `npm run verify`).
// Thiếu biến môi trường thì build bằng giá trị giả và in cảnh báo: vẫn kiểm được code,
// nhưng chưa thử với dữ liệu Supabase/Cloudinary thật.
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

const REQUIRED = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_placeholder',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'placeholder',
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: 'placeholder',
  CLOUDINARY_API_KEY: 'placeholder',
  CLOUDINARY_API_SECRET: 'placeholder',
};

const hasEnvFile = ['.env.local', '.env.production.local', '.env.production', '.env'].some(existsSync);
const missing = Object.keys(REQUIRED).filter((k) => !process.env[k]);
const env = { ...process.env };

if (!hasEnvFile && missing.length > 0) {
  for (const k of missing) env[k] = REQUIRED[k];
  console.warn(
    `\n[build-check] Không có .env.local và thiếu ${missing.length} biến môi trường.` +
      '\n[build-check] Đang build bằng giá trị GIẢ: chỉ xác minh biên dịch/route, KHÔNG xác minh kết nối Supabase/Cloudinary thật.' +
      '\n[build-check] Muốn build thật: tạo rodrick-blog/.env.local với các biến liệt kê ở CLAUDE.md.\n',
  );
}

// Xoá cache cũ để build giống trên Vercel.
rmSync('.next', { recursive: true, force: true });

const result = spawnSync('npx', ['next', 'build'], { stdio: 'inherit', env, shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
