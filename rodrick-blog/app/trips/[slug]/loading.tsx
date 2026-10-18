import React from 'react';

export default function TripDetailLoading() {
  return (
    <div className="w-full bg-[#FAF8F5] text-[#1C1B18] min-h-screen">
      {/* Top Red Theme Ambient Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#F0ECE4]/60 overflow-hidden pointer-events-none">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#B93829] to-transparent animate-trip-loading" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-200">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-16 bg-[#E8E4DC] rounded-md animate-pulse" />
          <span className="text-xs text-[#B5B0A6]">/</span>
          <div className="h-3.5 w-20 bg-[#E8E4DC] rounded-md animate-pulse" />
          <span className="text-xs text-[#B5B0A6]">/</span>
          <div className="h-3.5 w-32 bg-[#E0DDD5] rounded-md animate-pulse" />
        </div>

        {/* Hero Header with Red Theme Accent and Central Spinner */}
        <header className="relative bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-xs">
          {/* Shimmering Cover Skeleton with Red Theme Ambient Glow */}
          <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-[#F3F0EA] flex flex-col items-center justify-center p-6 text-center">
            {/* Subtle Red Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#B93829]/10 via-[#FAF8F5]/30 to-[#B93829]/5 animate-pulse" />

            {/* Center Red Spinner Badge */}
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-md">
              <div className="relative flex items-center justify-center">
                {/* Outer Red Ring Spinning */}
                <div className="w-16 h-16 rounded-full border-4 border-[#B93829]/20 border-t-[#B93829] animate-spin" />
                {/* Inner Glowing Monogram */}
                <div className="absolute w-8 h-8 rounded-full bg-[#B93829] text-white flex items-center justify-center text-xs font-serif font-bold shadow-md shadow-[#B93829]/30">
                  R
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm text-[#78756E] font-serif italic">
                  Đang tải dữ liệu. Chờ xíu nhé ...
                </p>
              </div>
            </div>
          </div>

          {/* Header Info Skeleton Details */}
          <div className="p-6 sm:p-8 space-y-4 bg-white">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-6 w-32 rounded-full bg-rose-100/70 border border-rose-200 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-[#EFECE4] animate-pulse" />
              <div className="h-6 w-40 rounded-full bg-[#EFECE4] animate-pulse" />
            </div>

            <div className="space-y-2 max-w-2xl">
              <div className="h-8 sm:h-10 w-3/4 bg-[#E2DDD5] rounded-xl animate-pulse" />
              <div className="h-4 w-full bg-[#EFECE4] rounded-md animate-pulse" />
              <div className="h-4 w-2/3 bg-[#EFECE4] rounded-md animate-pulse" />
            </div>

            <div className="pt-3 border-t border-[#F0ECE4] flex flex-wrap items-center gap-6">
              <div className="h-4 w-28 bg-[#EFECE4] rounded-md animate-pulse" />
              <div className="h-4 w-36 bg-[#EFECE4] rounded-md animate-pulse" />
              <div className="h-4 w-24 bg-[#EFECE4] rounded-md animate-pulse" />
            </div>
          </div>
        </header>

        {/* Day Filter Tabs Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E6E2DA]">
          <div className="h-9 w-24 bg-[#B93829]/15 border border-[#B93829]/30 rounded-xl animate-pulse" />
          <div className="h-9 w-20 bg-[#EFECE4] rounded-xl animate-pulse" />
          <div className="h-9 w-20 bg-[#EFECE4] rounded-xl animate-pulse" />
          <div className="h-9 w-20 bg-[#EFECE4] rounded-xl animate-pulse" />
        </div>

        {/* Timeline Events Skeleton Cards */}
        <div className="space-y-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden"
            >
              {/* Red accent bar on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B93829]/30" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-[#B93829] text-xs font-mono font-bold">
                    {item}
                  </div>
                  <div className="h-5 w-48 bg-[#E2DDD5] rounded-lg animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-rose-50 border border-rose-100 rounded-full animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="h-3.5 w-full bg-[#EFECE4] rounded-md animate-pulse" />
                <div className="h-3.5 w-4/5 bg-[#EFECE4] rounded-md animate-pulse" />
              </div>

              {/* Photo Placeholders */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="h-28 sm:h-36 rounded-xl bg-[#F0ECE4] border border-[#E8E4DC] animate-pulse" />
                <div className="h-28 sm:h-36 rounded-xl bg-[#F0ECE4] border border-[#E8E4DC] animate-pulse" />
                <div className="h-28 sm:h-36 rounded-xl bg-[#F0ECE4] border border-[#E8E4DC] hidden sm:block animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
