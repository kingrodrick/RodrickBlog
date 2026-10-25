'use client';

import React from 'react';
import { PhotoStack, StackPhoto, useAutoAdvance } from '@/components/ui/PhotoStack';
import { TicketPerf } from '@/components/ui/Ticket';

interface HeroSectionProps {
  photos: StackPhoto[];
}

export function HeroSection({ photos }: HeroSectionProps) {
  const [active] = useAutoAdvance(photos.length, 6000);
  const current = photos[active];

  return (
    <section
      aria-labelledby="home-title"
      className="frame pt-3 grid gap-3 lg:grid-cols-2 lg:h-[min(calc(100svh-var(--bar-h)-0.75rem),56rem)] lg:min-h-[600px]"
    >
      {/* Tấm vé: phần chính (tiêu đề, câu dẫn, hành động) và cuống vé (liên kết phụ) */}
      <div className="relative z-10 min-w-0 order-2 lg:order-1 -mt-6 lg:mt-0 mx-3 lg:mx-0 flex flex-col">
        <div className="ticket-main flex-1 flex flex-col justify-center p-6 pb-10 sm:p-10 sm:pb-12 xl:p-14 xl:pb-14">
          <div>
            <h1
              id="home-title"
              data-reveal
              className="text-display leading-[0.92] tracking-[-0.035em] max-w-[9ch]"
            >
              Rodrick đi và chụp
            </h1>
            <p
              data-reveal
              style={{ '--d': '90ms' } as React.CSSProperties}
              className="mt-8 lg:mt-10 text-lead leading-[1.35] max-w-[34ch]"
            >
              Chia sẻ những góc nhìn &amp; những chuyến hành trình của Rodrick thông qua từng con phố,
              ngôi chùa cổ kính, những món ăn địa phương và những bộ sưu tập hình ảnh thực tế từ ống
              kính máy ảnh.
            </p>
            <div data-reveal style={{ '--d': '180ms' } as React.CSSProperties} className="mt-10">
              <a href="#trips" className="btn">
                Xem các chuyến đi
              </a>
            </div>
          </div>
        </div>

        <div className="ticket-stub px-6 pt-8 pb-10 sm:px-10 xl:px-14">
          <TicketPerf />
          <div
            data-reveal
            style={{ '--d': '260ms' } as React.CSSProperties}
            className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-small"
          >
            <a href="#gallery" className="text-link font-semibold">
              Bộ sưu tập ảnh
            </a>
            <a href="#footer" className="text-link font-semibold">
              Về tôi
            </a>
            <span className="text-muted">Máy ảnh Sony A6400, ống kính 18–135mm</span>
          </div>
        </div>
      </div>

      {/* Ảnh lớn: các ảnh bìa chuyến đi và album lần lượt hiện ra */}
      <figure className="order-1 lg:order-2 relative h-[48svh] lg:h-auto">
        <PhotoStack photos={photos} active={active} drift priority className="absolute inset-0" />
        {current && (
          <figcaption className="absolute left-0 top-0 lg:top-auto lg:bottom-0 bg-ground px-4 py-2.5 text-small max-w-[80%]">
            {current.alt}
          </figcaption>
        )}
      </figure>
    </section>
  );
}

export default HeroSection;
