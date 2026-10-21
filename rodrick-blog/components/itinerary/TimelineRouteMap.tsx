'use client';

import React, { useMemo } from 'react';

export interface TimelineRouteMapProps {
  mapUrl?: string | null;
  map_embed_url?: string | null;
  mapEmbedUrl?: string | null;
  locationName?: string;
  city?: string;
}

export function TimelineRouteMap({
  mapUrl,
  map_embed_url,
  mapEmbedUrl,
  locationName,
  city,
}: TimelineRouteMapProps) {
  // Nhận linh hoạt giá trị từ database map_embed_url hoặc mapUrl / mapEmbedUrl
  const rawUrl = (map_embed_url || mapEmbedUrl || mapUrl || '').trim();

  // Tạo cụm từ tìm kiếm đầy đủ gồm Địa danh + Thành phố + Nhật Bản
  const fullSearchLocation = useMemo(() => {
    const parts = [locationName?.trim(), city?.trim(), 'Japan'].filter(Boolean);
    return parts.join(', ');
  }, [locationName, city]);

  // Phân tích và tối ưu hóa URL nhúng cho thẻ <iframe>
  const embedSrc = useMemo(() => {
    // 1. Trường hợp người dùng dán toàn bộ đoạn mã nhúng HTML dạng <iframe src="..."></iframe>
    if (rawUrl.includes('<iframe')) {
      const match = rawUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }

    // 2. Trường hợp là URL Google Maps trực tiếp
    if (rawUrl.length > 0) {
      // Nếu đã là link Google Maps Embed chính thức
      if (rawUrl.includes('/embed') || rawUrl.includes('output=embed')) {
        return rawUrl;
      }

      // Nếu là link Google Maps thông thường (search, place, dir...)
      if (rawUrl.includes('google.com/maps') || rawUrl.includes('maps.google.com')) {
        const separator = rawUrl.includes('?') ? '&' : '?';
        return `${rawUrl}${separator}output=embed`;
      }

      // Link khác (nếu có)
      return rawUrl;
    }

    return null;
  }, [rawUrl]);

  // URL chỉ đường trực tiếp mở ứng dụng Google Maps (Mobile / Desktop)
  const appDirectionsUrl = useMemo(() => {
    if (rawUrl.startsWith('http')) {
      return rawUrl.replace('&output=embed', '').replace('?output=embed', '');
    }

    if (locationName && locationName.trim().length > 0) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullSearchLocation)}`;
    }

    return 'https://www.google.com/maps';
  }, [locationName, fullSearchLocation, rawUrl]);

  // Yêu cầu: Nếu không có map_embed_url thì không hiển thị hộp thoại bản đồ
  if (!rawUrl || !embedSrc) {
    return null;
  }

  return (
    <aside
      aria-label={`Bản đồ định vị cho ${locationName || 'điểm đến'}`}
      className="relative group/comment-map w-full transition-all"
    >
      {/* 🌟 Đuôi nhọn của cửa sổ Comment trỏ sang Card Timeline bên trái (Desktop: lg+) */}
      <div
        className="hidden lg:block absolute -left-[9px] top-6 w-0 h-0 border-y-[7px] border-y-transparent border-r-[9px] border-r-[#E6E2DA] z-20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="hidden lg:block absolute -left-[7.5px] top-6 w-0 h-0 border-y-[7px] border-y-transparent border-r-[8px] border-r-[#FAF8F5] z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* 🌟 Đuôi nhọn của cửa sổ Comment trỏ ngược lên Card Timeline bên trên (Mobile / Tablet: <lg) */}
      <div
        className="block lg:hidden absolute -top-[9px] left-8 w-0 h-0 border-x-[7px] border-x-transparent border-b-[9px] border-b-[#E6E2DA] z-20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="block lg:hidden absolute -top-[7.5px] left-8 w-0 h-0 border-x-[7px] border-x-transparent border-b-[8px] border-b-[#FAF8F5] z-20 pointer-events-none"
        aria-hidden="true"
      />

      {/* 🌟 Khung cửa sổ Comment Box chứa Map vuông vắn độc lập bên ngoài Card */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#E6E2DA] bg-white shadow-xs hover:shadow-md transition-shadow">
        {/* Header Comment Box */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#FAF8F5] border-b border-[#EFECE4]">
          <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] font-bold text-[#4A4742] truncate">
            <span>📍</span>
            <span className="truncate">{locationName || 'Bản đồ vị trí'}</span>
          </div>

          {/* Nút bấm mở nhanh ứng dụng Google Maps */}
          <a
            href={appDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#B61C25] text-white hover:bg-[#98171E] active:scale-[0.98] transition-all shrink-0 shadow-2xs"
            title="Mở chỉ đường trên ứng dụng Google Maps"
          >
            <span>Mở App</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>

        {/* Khung bản đồ cân xứng với tỉ lệ 40% */}
        <div className="w-full h-[240px] sm:h-[260px] lg:h-[280px] relative bg-[#F5F2EB]">
          {embedSrc ? (
            <iframe
              title={`Bản đồ Google Maps cho: ${locationName || ''}`}
              src={embedSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] font-mono text-[#78756E]">
              <span>🗺️</span>
              <span>Chưa có bản đồ</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default TimelineRouteMap;
