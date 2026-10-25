import React from 'react';
import Link from 'next/link';
import { ItineraryService, TripWithDetails } from '@/services/itinerary.service';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import { formatDuration, pickNextTrip, tripDurationDays } from '@/lib/tripFormat';

// Tạm ẩn phần "Về tôi"; đổi thành true để hiện lại
const SHOW_ABOUT = false;

/** Ảnh cuối cùng trên timeline của chuyến đi, dùng làm tấm ảnh khép trang */
function lastPhoto(trip: TripWithDetails | null): { src: string; alt: string } | null {
  const events = trip?.timeline_events || [];
  for (let i = events.length - 1; i >= 0; i--) {
    const imgs = events[i].images || [];
    const real = imgs.find((img) => img.is_real_photo !== false) || imgs[0];
    if (real?.cloudinary_url) {
      return {
        src: optimizeCloudinaryUrl(real.cloudinary_url),
        alt: real.caption || events[i].location_name,
      };
    }
  }
  return trip?.cover_image ? { src: optimizeCloudinaryUrl(trip.cover_image), alt: trip.title } : null;
}

/** Lấy chuyến đi kế tiếp rồi dựng footer; được bọc trong Suspense ở layout */
export async function Footer() {
  let nextTrip: TripWithDetails | null = null;
  try {
    nextTrip = pickNextTrip(await ItineraryService.getAllTrips());
  } catch {
    nextTrip = null;
  }
  return <FooterView nextTrip={nextTrip} />;
}

/** Footer không cần dữ liệu: dùng làm bản dự phòng khi đang tải (nền mực thay cho ảnh) */
export function FooterView({ nextTrip }: { nextTrip: TripWithDetails | null }) {
  const days = nextTrip ? tripDurationDays(nextTrip.start_date, nextTrip.end_date) : 0;
  const photo = lastPhoto(nextTrip);

  return (
    <footer id="footer" className="mt-40 lg:mt-56 scroll-mt-16">
      {/* Về tôi: một lá thư ngắn */}
      {SHOW_ABOUT && (
        <section aria-labelledby="about-title" className="frame mb-32 lg:mb-48 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <h2 id="about-title" data-reveal className="text-head lg:col-span-4">
            Về tôi
          </h2>
          <div className="lg:col-start-6 lg:col-span-6 space-y-6 max-w-[58ch]">
            <blockquote
              data-reveal
              style={{ '--d': '80ms' } as React.CSSProperties}
              className="text-lead leading-[1.3]"
            >
              “Đi để mở rộng thế giới quan, chụp để lưu giữ nhịp thở của từng góc phố.”
            </blockquote>
            <p data-reveal style={{ '--d': '160ms' } as React.CSSProperties}>
              Nhật ký hành trình độc hành và kho lưu trữ hình ảnh thực tế ghi lại từ máy ảnh Sony A6400
              trong chuyến đi Nhật Bản (Tokyo &amp; Kyoto).
            </p>
            <p data-reveal style={{ '--d': '220ms' } as React.CSSProperties}>
              Trạng thái: chuẩn bị lên đường tháng 12/2026.
            </p>
            <p data-reveal style={{ '--d': '280ms' } as React.CSSProperties} className="pt-2">
              <span className="block text-lead italic">Rodrick</span>
              <span className="block text-small text-muted">Hà Nội, Sài Gòn, Tokyo, Kyoto</span>
            </p>
          </div>
        </section>
      )}

      {/* Dải ảnh khép trang: logo, chuyên mục, kết nối và bản quyền */}
      <div className="relative overflow-hidden bg-night text-night-ink">
        {photo && (
          <img
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
          />
        )}

        <div className="relative frame pt-16 pb-8 lg:pt-20">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Logo giống thanh điều hướng, kèm một câu giới thiệu */}
            <div className="sm:col-span-2 lg:col-span-5">
              <Link href="/" className="group inline-flex flex-col leading-none">
                <span className="flex items-center gap-1">
                  <span className="text-xl font-bold tracking-tight transition-colors duration-200 group-hover:text-accent">
                    RODRICK
                  </span>
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent" />
                </span>
                <span className="mt-1 text-[9px] uppercase tracking-widest opacity-70">
                  Blog xàm xí của Rodrick
                </span>
              </Link>
              <p className="mt-6 max-w-[38ch] text-small opacity-80">
                Lịch trình từng giờ và ảnh chụp thực tế từ những chuyến đi, ghi lại bằng Sony A6400.
              </p>
            </div>

            <div className="lg:col-start-7 lg:col-span-3">
              <h3 className="text-small font-semibold">Chuyên mục</h3>
              <ul className="mt-3 space-y-1.5 text-small">
                <li>
                  <Link href="/#trips" className="text-link">
                    Lịch trình chi tiết{days > 0 ? ` (${formatDuration(days)})` : ''}
                  </Link>
                </li>
                <li>
                  <Link href="/#gallery" className="text-link">
                    Bộ sưu tập nhiếp ảnh
                  </Link>
                </li>
                <li className="opacity-80">Điểm đến: Tokyo &amp; Kyoto</li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-small font-semibold">Kết nối</h3>
              <ul className="mt-3 space-y-1.5 text-small">
                <li>
                  <a
                    href="https://github.com/kingrodrick"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    GitHub
                  </a>
                </li>
                <li className="opacity-80">Thiết bị: Sony A6400 (18-135mm)</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between text-small opacity-80">
            <p>© 2026 Rodrick. Crafted with Next.js &amp; Supabase.</p>
            {photo && <p>Ảnh nền: {photo.alt}</p>}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
