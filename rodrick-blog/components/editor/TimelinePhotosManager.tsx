'use client';

import React, { useState, useRef } from 'react';

export interface TimelineImageItem {
  id: string;
  url: string;
  caption: string;
  isRealPhoto: boolean;
  cameraGear: string;
  exifInfo: string;
}

interface TimelinePhotosManagerProps {
  images: TimelineImageItem[];
  onChange: (images: TimelineImageItem[]) => void;
  city?: string;
}

// Curated presets for Rodrick's Japan travel blog
const JAPAN_PHOTO_PRESETS = [
  {
    label: '🍜 Mì Ramen Tonkotsu',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80',
    caption: 'Tô mì Ramen nóng hổi nước dùng xương hầm đậm đà',
    gear: 'Sony A6400 • 35mm f/1.8',
    exif: '35mm • f/2.0 • 1/160s • ISO 800',
    isReal: true,
  },
  {
    label: '⛩️ Đền Asakusa Senso-ji',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
    caption: 'Cổng đền Senso-ji cổ kính và tháp 5 tầng',
    gear: 'Sony A6400 • 18-135mm',
    exif: '18mm • f/5.6 • 1/320s • ISO 100',
    isReal: true,
  },
  {
    label: '🏮 Phố Lồng Đèn Gion',
    url: 'https://images.unsplash.com/photo-1558862107-d49ef2a04d72?auto=format&fit=crop&w=1000&q=80',
    caption: 'Đèn lồng đỏ sáng rực trong ngõ nhỏ phố Gion về đêm',
    gear: 'Sony A6400 • 18-135mm',
    exif: '35mm • f/1.8 • 1/80s • ISO 1600',
    isReal: true,
  },
  {
    label: '🏯 Chùa Vàng Kinkaku-ji',
    url: 'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?auto=format&fit=crop&w=1000&q=80',
    caption: 'Gác Vàng Kinkaku-ji soi bóng lung linh trên mặt hồ',
    gear: 'Sony A6400 • 18-135mm',
    exif: '28mm • f/5.6 • 1/400s • ISO 100',
    isReal: true,
  },
  {
    label: '🎋 Rừng Trúc Arashiyama',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80',
    caption: 'Ánh nắng ban mai xuyên qua hàng trúc Arashiyama',
    gear: 'Sony A6400 • 18-135mm',
    exif: '24mm • f/4.0 • 1/200s • ISO 200',
    isReal: true,
  },
  {
    label: '🌃 Phố Đèn Neon Kabukicho',
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1000&q=80',
    caption: 'Biển hiệu neon rực rỡ góc phố Kabukicho Shinjuku',
    gear: 'Sony A6400 • 18-135mm',
    exif: '24mm • f/3.5 • 1/60s • ISO 1600',
    isReal: true,
  },
  {
    label: '🚄 Tàu Shinkansen Nozomi',
    url: 'https://images.unsplash.com/photo-1532188978303-4bfac6639ca9?auto=format&fit=crop&w=1000&q=80',
    caption: 'Chuyến tàu Shinkansen tốc độ cao hướng về Kyoto',
    gear: 'Sony A6400 • 18-135mm',
    exif: '35mm • f/4.5 • 1/500s • ISO 100',
    isReal: true,
  },
  {
    label: '🗼 Tokyo Skytree & Sông',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1000&q=80',
    caption: 'Góc nhìn hướng về tháp Tokyo Skytree từ bờ sông Sumida',
    gear: 'Sony A6400 • 18-135mm',
    exif: '50mm • f/6.3 • 1/250s • ISO 100',
    isReal: false,
  },
];

export function TimelinePhotosManager({
  images,
  onChange,
  city = 'Tokyo',
}: TimelinePhotosManagerProps) {
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const targetReplaceIdRef = useRef<string | null>(null);

  // Compress file to lightweight base64
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return resolve('');

        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 900;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Process multiple files and append to list
  const processMultipleFiles = async (files: FileList | File[]) => {
    try {
      setIsProcessingFiles(true);
      const newItems: TimelineImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const dataUrl = await compressImageFile(file);
        if (dataUrl) {
          const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          newItems.push({
            id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            url: dataUrl,
            caption: fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1),
            isRealPhoto: true,
            cameraGear: 'Sony A6400 • 18-135mm',
            exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
          });
        }
      }

      if (newItems.length > 0) {
        // If current image list only has 1 blank image, replace it
        if (images.length === 1 && !images[0].url.trim()) {
          onChange(newItems);
        } else {
          onChange([...images, ...newItems]);
        }
      }
    } catch (err) {
      console.error('Lỗi khi xử lý tải nhiều ảnh:', err);
    } finally {
      setIsProcessingFiles(false);
      if (multiFileInputRef.current) {
        multiFileInputRef.current.value = '';
      }
    }
  };

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processMultipleFiles(e.target.files);
    }
  };

  // Drag and drop handlers for top dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(e.dataTransfer.files);
    }
  };

  // Replace a single photo file
  const handleTriggerReplaceSinglePhoto = (id: string) => {
    targetReplaceIdRef.current = id;
    singleFileInputRef.current?.click();
  };

  const handleSingleFileReplaced = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = targetReplaceIdRef.current;
    if (file && targetId) {
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        handleUpdateItem(targetId, { url: dataUrl });
      }
    }
    targetReplaceIdRef.current = null;
    e.target.value = '';
  };

  // Add single empty image field
  const handleAddEmptyImage = () => {
    const newItemId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    onChange([
      ...images,
      {
        id: newItemId,
        url: '',
        caption: '',
        isRealPhoto: true,
        cameraGear: 'Sony A6400 • 18-135mm',
        exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
      },
    ]);
    setEditingImageId(newItemId);
  };

  // Add from preset
  const handleAddPreset = (preset: typeof JAPAN_PHOTO_PRESETS[0]) => {
    const newItem: TimelineImageItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: preset.url,
      caption: preset.caption,
      isRealPhoto: preset.isReal,
      cameraGear: preset.gear,
      exifInfo: preset.exif,
    };

    if (images.length === 1 && !images[0].url.trim()) {
      onChange([newItem]);
    } else {
      onChange([...images, newItem]);
    }
  };

  // Update image item
  const handleUpdateItem = (id: string, updates: Partial<TimelineImageItem>) => {
    onChange(images.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Remove image item
  const handleRemoveItem = (id: string) => {
    const updated = images.filter((item) => item.id !== id);
    if (updated.length === 0) {
      onChange([
        {
          id: `img-${Date.now()}`,
          url: '',
          caption: '',
          isRealPhoto: true,
          cameraGear: 'Sony A6400 • 18-135mm',
          exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
        },
      ]);
    } else {
      onChange(updated);
    }
  };

  const realCount = images.filter((img) => img.url.trim() && img.isRealPhoto).length;
  const refCount = images.filter((img) => img.url.trim() && !img.isRealPhoto).length;
  const totalCount = images.filter((img) => img.url.trim()).length;

  return (
    <div className="space-y-4 pt-4 border-t border-[#F0ECE4]">
      {/* Hidden inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleMultiFileSelect}
        className="hidden"
      />
      <input
        ref={singleFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSingleFileReplaced}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-base font-bold text-[#1C1B18]">
              Bộ Sưu Tập Ảnh Sự Kiện ({totalCount} ảnh)
            </h4>
            {totalCount > 1 && (
              <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                ✓ Bố cục tạp chí đa ảnh ({totalCount} khung hình)
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-[#78756E] mt-0.5">
            Một mốc sự kiện có thể có nhiều ảnh. Bạn có thể chọn cùng lúc 2, 3, 5 ảnh từ máy hoặc dán link URL.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {realCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              📷 {realCount} Sony A6400
            </span>
          )}
          {refCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
              🌐 {refCount} Tham khảo web
            </span>
          )}
        </div>
      </div>

      {/* PRIMARY PROMINENT MULTI-PHOTO UPLOAD DROPZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => multiFileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#B93829] bg-rose-50'
            : 'border-[#B93829]/60 hover:border-[#B93829] bg-[#FAF8F5] hover:bg-rose-50/40 shadow-xs'
        }`}
      >
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-[#B93829] flex items-center justify-center text-xl shadow-xs">
            {isProcessingFiles ? (
              <div className="w-6 h-6 border-2 border-[#B93829] border-t-transparent rounded-full animate-spin" />
            ) : (
              '📷'
            )}
          </div>
          <div>
            <p className="text-sm font-sans font-bold text-[#1C1B18]">
              {isProcessingFiles
                ? 'Đang tải lên và tối ưu hóa các bức ảnh...'
                : 'BẤM VÀO ĐÂY ĐỂ CHỌN NHIỀU ẢNH CÙNG LÚC TỪ MÁY TÍNH'}
            </p>
            <p className="text-xs font-mono text-[#78756E] mt-1">
              ★ Giữ phím <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[10px] font-bold">Ctrl</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[10px] font-bold">Shift</kbd> để chọn cùng lúc 2, 3, 5 ảnh JPG/PNG/WebP
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
              ✓ Hỗ trợ tải hàng loạt
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#57544E] bg-white border border-stone-200 px-3 py-1 rounded-full">
              ⚡ Tự động nén dung lượng nhẹ
            </span>
          </div>
        </div>
      </div>

      {/* Auxiliary Actions: Quick Preset & Add via URL */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Quick Add Preset Toggle */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-mono text-xs font-semibold transition-all cursor-pointer ${
              showPresets
                ? 'bg-rose-50 text-[#B93829] border-[#B93829]'
                : 'bg-white text-stone-700 border-[#E6E2DA] hover:bg-stone-50'
            }`}
          >
            <span>✨</span>
            <span>{showPresets ? 'Ẩn kho ảnh mẫu' : 'Chọn ảnh mẫu Nhật Bản (8 ảnh tuyển chọn)'}</span>
          </button>

          {/* Add Empty URL Field */}
          <button
            type="button"
            onClick={handleAddEmptyImage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-[#E6E2DA] text-stone-700 font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <span>🔗</span>
            <span>Thêm ảnh bằng link URL</span>
          </button>
        </div>

        <span className="text-xs font-mono text-[#8C8881]">
          Đã có {images.filter((img) => img.url.trim()).length} ảnh sẵn sàng
        </span>
      </div>

      {/* Preset Gallery Picker (if toggled) */}
      {showPresets && (
        <div className="p-4 rounded-2xl bg-[#F8F5EE] border border-[#E6E2DA] space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-mono text-[#57544E]">
            <span className="font-semibold text-[#1C1B18]">
              Nhấp vào bất kỳ ảnh nào để thêm ngay vào mốc này:
            </span>
            <span>Kho ảnh mẫu Rodrick Blog</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {JAPAN_PHOTO_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(p)}
                className="group relative rounded-xl overflow-hidden border border-[#E6E2DA] hover:border-[#B93829] bg-white p-1 text-left transition-all cursor-pointer hover:shadow-md"
              >
                <div className="relative h-20 w-full rounded-lg overflow-hidden bg-[#EAE6DE]">
                  <img
                    src={p.url}
                    alt={p.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                    + Thêm vào
                  </span>
                </div>
                <p className="font-mono text-[10px] font-semibold text-[#1C1B18] mt-1 truncate">
                  {p.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List of Photo Cards */}
      <div className="space-y-4">
        {images.map((img, index) => {
          const isUrlEmpty = !img.url.trim();

          return (
            <div
              key={img.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6E2DA] space-y-4 relative hover:border-[#D0C9BD] shadow-xs transition-all"
            >
              {/* Top row: Label, type toggle, delete */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE4] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1C1B18] bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#E6E2DA]">
                    Ảnh #{index + 1}
                  </span>

                  {/* Source Type Toggle */}
                  <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E6E2DA]">
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(img.id, { isRealPhoto: true })}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                        img.isRealPhoto
                          ? 'bg-emerald-700 text-white font-bold shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>📷</span>
                      <span>Sony A6400 (Thực tế)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(img.id, { isRealPhoto: false })}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                        !img.isRealPhoto
                          ? 'bg-sky-700 text-white font-bold shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>🌐</span>
                      <span>Tham khảo web</span>
                    </button>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(img.id)}
                  className="text-xs font-mono text-rose-600 hover:text-white hover:bg-rose-600 px-2.5 py-1 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Xóa bức ảnh này"
                >
                  <span>🗑️</span>
                  <span>Xóa ảnh</span>
                </button>
              </div>

              {/* Middle Row: Photo Preview & Edit details */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Left Thumbnail & Change Photo Button */}
                <div className="w-full sm:w-44 shrink-0 space-y-2">
                  {img.url ? (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#E6E2DA] bg-[#FAF8F5] group">
                      <img
                        src={img.url}
                        alt={img.caption || 'Ảnh lịch trình'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleTriggerReplaceSinglePhoto(img.id)}
                          className="bg-white text-[#1C1B18] font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md cursor-pointer hover:bg-rose-50 hover:text-[#B93829]"
                        >
                          ✏️ Chọn ảnh khác
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleTriggerReplaceSinglePhoto(img.id)}
                      className="h-32 w-full rounded-xl border-2 border-dashed border-[#B93829]/60 hover:border-[#B93829] bg-rose-50/30 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-all"
                    >
                      <span className="text-xl">📷</span>
                      <span className="text-[11px] font-mono font-semibold text-[#B93829] mt-1">
                        Bấm để chọn file
                      </span>
                    </div>
                  )}

                  {/* Quick Change / Upload Actions for this photo */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleTriggerReplaceSinglePhoto(img.id)}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#FAF8F5] hover:bg-[#1C1B18] hover:text-white text-stone-700 border border-[#E6E2DA] transition-colors text-center cursor-pointer"
                    >
                      📁 Đổi file
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingImageId(editingImageId === img.id ? null : img.id)
                      }
                      className="py-1 px-2 rounded-lg bg-[#FAF8F5] hover:bg-stone-200 text-stone-700 border border-[#E6E2DA] transition-colors text-center cursor-pointer"
                      title="Sửa link URL trực tiếp"
                    >
                      🔗 Link
                    </button>
                  </div>
                </div>

                {/* Right Form Inputs */}
                <div className="flex-1 w-full space-y-3">
                  {/* Inline URL input if editing URL */}
                  {(editingImageId === img.id || isUrlEmpty) && (
                    <div className="space-y-1 p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E2DA]">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E] font-semibold">
                        Liên kết URL ảnh (Cloudinary / Unsplash...)
                      </label>
                      <input
                        type="url"
                        value={img.url}
                        onChange={(e) => handleUpdateItem(img.id, { url: e.target.value })}
                        placeholder="https://images.unsplash.com/... hoặc dán link ảnh"
                        className="w-full bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-1.5 text-xs font-mono text-[#1C1B18] outline-hidden"
                      />
                    </div>
                  )}

                  {/* Caption Input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E] font-semibold">
                      Chú thích ảnh (Caption)
                    </label>
                    <input
                      type="text"
                      value={img.caption}
                      onChange={(e) => handleUpdateItem(img.id, { caption: e.target.value })}
                      placeholder="VD: Cổng Torii trong làn sương sớm ban mai..."
                      className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-2 text-xs font-sans text-[#1C1B18] outline-hidden shadow-2xs"
                    />
                  </div>

                  {/* Camera Gear & EXIF inputs */}
                  {img.isRealPhoto ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E] font-semibold">
                          Thiết bị & Lens
                        </label>
                        <input
                          type="text"
                          value={img.cameraGear}
                          onChange={(e) =>
                            handleUpdateItem(img.id, { cameraGear: e.target.value })
                          }
                          placeholder="Sony A6400 • 18-135mm"
                          className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-1.5 text-xs font-mono text-[#1C1B18] outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E] font-semibold">
                          Thông số EXIF
                        </label>
                        <input
                          type="text"
                          value={img.exifInfo}
                          onChange={(e) =>
                            handleUpdateItem(img.id, { exifInfo: e.target.value })
                          }
                          placeholder="35mm • f/4.0 • 1/250s • ISO 100"
                          className="w-full bg-[#FAF8F5] focus:bg-white border border-[#E6E2DA] focus:border-[#B93829] rounded-xl px-3 py-1.5 text-xs font-mono text-[#1C1B18] outline-hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#FAF8F5] border border-[#E6E2DA] rounded-xl text-[11px] font-mono text-stone-500 flex items-center gap-2">
                      <span>🌐</span>
                      <span>Ảnh được đánh dấu là ảnh minh họa / tư liệu tham khảo lịch trình.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelinePhotosManager;
