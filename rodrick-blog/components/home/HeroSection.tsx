import React from 'react';

export function HeroSection() {
  return (
    <section className="relative bg-[#F3F0EA] border border-[#E5E0D8] rounded-xl p-8 mb-4 sm:p-12 overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="max-w-2xl space-y-5">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 border border-[#E2DDD5] rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#57544E]">
            <span className="w-2 h-2 rounded-full bg-[#B93829] animate-pulse" />
            <span>Blog cá nhân của Rodrick</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.15] text-[#1C1B18]">
            Những góc nhìn & những chuyến hành trình{' '}
            <span className="italic text-[#B93829] font-normal">Rodrick.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-serif italic text-lg sm:text-xl text-[#4A4742] leading-relaxed">
            Chia sẽ những góc nhìn & những chuyến hành trình của Rodrick thông qua từng con phố, ngôi chùa cổ kính, những món ăn địa phương và những bộ sưu tập hình ảnh thực tế từ ống kính máy ảnh.
          </p>

          {/* Meta Tags */}
          <div className="flex flex-wrap items-center gap-5 pt-2 text-[11px] font-mono uppercase tracking-wider text-[#78756E]">
            <span className="flex items-center gap-1.5">📷 Sony A6400 • 18-135mm</span>
          </div>
        </div>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
          <a
            href="#trips"
            className="bg-[#1C1B18] text-white text-xs font-mono uppercase tracking-wider px-5 py-3.5 rounded flex items-center justify-between hover:bg-[#33312B] transition-colors"
          >
            <span>Xem các chuyến đi</span>
            <span>↓</span>
          </a>
          <a
            href="#gallery"
            className="bg-white border border-[#DCD7CE] text-[#1C1B18] text-xs font-mono uppercase tracking-wider px-5 py-3.5 rounded flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
          >
            <span>Bộ sưu tập ảnh</span>
            <span>↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
