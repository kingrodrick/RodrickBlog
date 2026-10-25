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
  const embedSrc = useMemo((): string | null => {
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
      className="w-full h-full flex flex-col bg-surface"
    >
      {/* Khung bản đồ chiếm trọn chiều cao còn lại */}
      <div className="w-full flex-1 min-h-[240px] relative">
        <iframe
          title={`Bản đồ Google Maps cho: ${locationName || ''}`}
          src={embedSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full absolute inset-0"
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-paper text-small shrink-0">
        <span className="truncate">Tuyến đường: {locationName || 'Bản đồ vị trí'}</span>
        <a
          href={appDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link font-semibold shrink-0"
        >
          Mở Google Maps
        </a>
      </div>
    </aside>
  );
}

export default TimelineRouteMap;
