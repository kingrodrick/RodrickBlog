'use client';

import React, { useState, useMemo, useEffect } from 'react';

export interface AdminRoutePickerMapProps {
  value?: [number, number][] | null;
  onChange?: (coords: [number, number][]) => void;
  initialCity?: string;
  locationName?: string;
  mapEmbedUrl?: string | null;
  onMapEmbedUrlChange?: (url: string) => void;
}

/**
 * Giải mã ngược saddr, daddr, q từ link Google Maps đã lưu
 */
function parseEmbedUrlParams(url?: string | null) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) return null;
  const raw = url.trim();
  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
  const actualUrl = srcMatch ? srcMatch[1] : raw;

  try {
    const urlObj = new URL(actualUrl.startsWith('http') ? actualUrl : `https://${actualUrl}`);
    const saddr = urlObj.searchParams.get('saddr');
    const daddr = urlObj.searchParams.get('daddr');
    const q = urlObj.searchParams.get('q');
    return {
      origin: saddr ? decodeURIComponent(saddr) : null,
      destination: daddr ? decodeURIComponent(daddr) : null,
      query: q ? decodeURIComponent(q) : null,
    };
  } catch {
    const saddrMatch = actualUrl.match(/[?&]saddr=([^&]+)/);
    const daddrMatch = actualUrl.match(/[?&]daddr=([^&]+)/);
    const qMatch = actualUrl.match(/[?&]q=([^&]+)/);
    return {
      origin: saddrMatch ? decodeURIComponent(saddrMatch[1]) : null,
      destination: daddrMatch ? decodeURIComponent(daddrMatch[1]) : null,
      query: qMatch ? decodeURIComponent(qMatch[1]) : null,
    };
  }
}

export function AdminRoutePickerMap({
  initialCity,
  locationName,
  mapEmbedUrl,
  onMapEmbedUrlChange,
}: AdminRoutePickerMapProps) {
  const parsedParams = useMemo(() => parseEmbedUrlParams(mapEmbedUrl), [mapEmbedUrl]);

  // Trạng thái mở/thu gọn panel nhập lộ trình bên phải
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [origin, setOrigin] = useState<string>(() => {
    return parsedParams?.origin || (initialCity ? `Ga ${initialCity}` : 'Ga Tokyo, Japan');
  });

  const [destination, setDestination] = useState<string>(() => {
    return (
      parsedParams?.destination ||
      (locationName
        ? `${locationName}, ${initialCity || 'Japan'}`
        : 'Chùa Kinkaku-ji, Kyoto')
    );
  });

  // Đồng bộ lại khi mapEmbedUrl hoặc locationName từ ngoài truyền vào
  useEffect(() => {
    if (parsedParams) {
      if (parsedParams.origin) setOrigin(parsedParams.origin);
      if (parsedParams.destination) setDestination(parsedParams.destination);
    } else if (locationName && locationName.trim()) {
      setDestination(`${locationName.trim()}, ${initialCity || 'Japan'}`);
    }
  }, [parsedParams, locationName, initialCity]);

  // Tính toán link Embed tự động theo origin và destination
  const currentEmbedUrl = useMemo(() => {
    if (
      mapEmbedUrl &&
      mapEmbedUrl.trim().length > 0 &&
      !mapEmbedUrl.includes('saddr=') &&
      !mapEmbedUrl.includes('daddr=')
    ) {
      const match = mapEmbedUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) return match[1];
      if (mapEmbedUrl.includes('/embed') || mapEmbedUrl.includes('output=embed')) {
        return mapEmbedUrl.trim();
      }
      const sep = mapEmbedUrl.includes('?') ? '&' : '?';
      return `${mapEmbedUrl.trim()}${sep}output=embed`;
    }

    if (origin.trim() && destination.trim()) {
      const originQuery = encodeURIComponent(origin.trim());
      const destQuery = encodeURIComponent(destination.trim());
      return `https://www.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&output=embed`;
    }

    if (destination.trim()) {
      return `https://www.google.com/maps?q=${encodeURIComponent(destination.trim())}&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(initialCity || 'Tokyo')},Japan&output=embed`;
  }, [mapEmbedUrl, origin, destination, initialCity]);

  // URL mở trực tiếp trên app Google Maps
  const directAppUrl = useMemo(() => {
    if (origin.trim() && destination.trim()) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.trim())}&destination=${encodeURIComponent(destination.trim())}&travelmode=transit`;
    }
    if (destination.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.trim())}`;
    }
    return 'https://www.google.com/maps';
  }, [origin, destination]);

  // Tự động lưu URL mới sang form cha khi origin hoặc destination thay đổi
  const updateRoute = (newOrigin: string, newDest: string) => {
    setOrigin(newOrigin);
    setDestination(newDest);
    if (onMapEmbedUrlChange && newOrigin.trim() && newDest.trim()) {
      const originQuery = encodeURIComponent(newOrigin.trim());
      const destQuery = encodeURIComponent(newDest.trim());
      onMapEmbedUrlChange(`https://www.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&output=embed`);
    }
  };

  // Nút đảo chiều điểm đi & điểm đến
  const handleSwap = () => {
    updateRoute(destination, origin);
  };

  const fieldClass =
    'w-full bg-paper border border-transparent px-3 py-2 text-small text-ink outline-none transition-colors duration-200 hover:border-surface focus:border-ink';

  return (
    <div className="w-full space-y-3 min-w-0">
      {/* Đầu khối: tiêu đề, lộ trình hiện tại, hai hành động dạng liên kết */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="text-small font-semibold">Xem trước tuyến đường</p>
          {origin.trim() && destination.trim() && (
            <p className="mt-1 text-small text-muted truncate">
              {origin} → {destination}
            </p>
          )}
        </div>
        <div className="flex items-center gap-5 shrink-0 text-small font-semibold">
          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            aria-expanded={isPanelOpen}
            className="text-link cursor-pointer"
          >
            {isPanelOpen ? 'Ẩn bảng lộ trình' : 'Đổi điểm đi và đến'}
          </button>
          <a href={directAppUrl} target="_blank" rel="noopener noreferrer" className="text-link">
            Mở Google Maps ↗
          </a>
        </div>
      </div>

      {/* Bản đồ, và bảng nhập lộ trình trượt ra bên phải khi mở */}
      <div className="w-full flex flex-col md:flex-row gap-3 items-stretch min-w-0">
        <div
          className={`h-[380px] overflow-hidden bg-surface transition-all duration-300 ease-out ${
            isPanelOpen ? 'w-full md:w-[calc(68%-6px)] min-w-0 shrink-0' : 'w-full'
          }`}
        >
          <iframe
            title="Xem trước bản đồ Google Maps"
            src={currentEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>

        <div
          className={`transition-all duration-300 ease-out overflow-hidden flex flex-col min-w-0 ${
            isPanelOpen
              ? 'w-full md:w-[calc(32%-6px)] md:shrink-0 opacity-100 translate-x-0'
              : 'w-0 max-h-0 md:max-h-[380px] opacity-0 translate-x-4 pointer-events-none'
          }`}
        >
          <div className="h-full bg-ground p-5 flex flex-col justify-center gap-4 w-full min-w-0">
            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 text-small font-semibold">
                <span aria-hidden="true" className="w-2.5 h-2.5 border-2 border-ink" />
                Điểm xuất phát
              </span>
              <input
                type="text"
                value={origin}
                onChange={(e) => updateRoute(e.target.value, destination)}
                placeholder="VD: Ga Tokyo, Ga Kyoto"
                className={fieldClass}
              />
            </label>

            <button
              type="button"
              onClick={handleSwap}
              title="Đảo chiều điểm xuất phát và điểm đến"
              className="self-start min-h-9 px-3 text-small font-semibold bg-paper hover:bg-surface cursor-pointer transition-colors duration-200"
            >
              ⇅ Đổi chiều
            </button>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 text-small font-semibold">
                <span aria-hidden="true" className="w-2.5 h-2.5 bg-accent" />
                Điểm đến
              </span>
              <input
                type="text"
                value={destination}
                onChange={(e) => updateRoute(origin, e.target.value)}
                placeholder="VD: Chùa Kinkaku-ji, Asakusa"
                className={fieldClass}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRoutePickerMap;
