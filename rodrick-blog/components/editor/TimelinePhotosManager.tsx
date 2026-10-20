'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  buildCloudinaryTimelineFolder,
  slugifyFolderName,
} from '@/lib/cloudinary';

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
  tripSlug?: string;
  tripTitle?: string;
  tripDate?: string;
}

export function TimelinePhotosManager({
  images,
  onChange,
  city = 'Tokyo',
  tripSlug,
  tripTitle,
  tripDate,
}: TimelinePhotosManagerProps) {
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(() => images[0]?.id || null);
  const [justPastedId, setJustPastedId] = useState<string | null>(null);
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const targetReplaceIdRef = useRef<string | null>(null);

  // Sync selected card when images change
  useEffect(() => {
    if (images.length > 0) {
      if (!selectedCardId || !images.some((img) => img.id === selectedCardId)) {
        const emptyCard = images.find((img) => !img.url.trim());
        setSelectedCardId(emptyCard ? emptyCard.id : images[0].id);
      }
    } else {
      setSelectedCardId(null);
    }
  }, [images, selectedCardId]);

  // Compress file to lightweight base64 (fallback nếu chưa cấu hình Cloudinary)
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

  // Tải ảnh: Phân loại thư mục [trip]/Timelines/[date]/[ThucTe | ThamKhao] và upload lên Cloudinary
  const handleUploadImageFile = async (
    file: File,
    index = 1,
    total = 1,
    isRealPhoto = true
  ): Promise<string> => {
    setUploadStatus(
      total > 1
        ? `Đang tải ảnh ${index}/${total} lên Cloudinary...`
        : 'Đang tải ảnh lên Cloudinary...'
    );

    try {
      const folder = buildCloudinaryTimelineFolder(tripSlug || tripTitle, tripDate, isRealPhoto);
      const cloudinaryUrl = await uploadToCloudinary(file, folder);
      setCloudinaryError(null);
      return cloudinaryUrl;
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải ảnh lên Cloudinary';
      console.warn('Upload Cloudinary không thành công:', msg);
      setCloudinaryError(msg);
      return await compressImageFile(file);
    }
  };

  // Process multiple files and append to list
  const processMultipleFiles = async (files: FileList | File[], forceIsReal?: boolean) => {
    try {
      setIsProcessingFiles(true);
      const newItems: TimelineImageItem[] = [];
      const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));

      const selectedItem = images.find((img) => img.id === selectedCardId);
      const isReal = forceIsReal !== undefined ? forceIsReal : (selectedItem ? selectedItem.isRealPhoto : true);

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const finalUrl = await handleUploadImageFile(file, i + 1, validFiles.length, isReal);

        if (finalUrl) {
          const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          newItems.push({
            id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            url: finalUrl,
            caption: fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1),
            isRealPhoto: isReal,
            cameraGear: isReal ? 'Sony A6400 • 18-135mm' : 'Ảnh tham khảo Web',
            exifInfo: isReal ? '35mm • f/4.0 • 1/250s • ISO 100' : 'Sưu tầm & tổng hợp',
          });
        }
      }

      if (newItems.length > 0) {
        // If current image list only has 1 blank image, replace it
        if (images.length === 1 && !images[0].url.trim()) {
          onChange(newItems);
          setSelectedCardId(newItems[0].id);
        } else {
          onChange([...images, ...newItems]);
          setSelectedCardId(newItems[newItems.length - 1].id);
        }
      }
    } catch (err) {
      console.error('Lỗi khi xử lý tải nhiều ảnh:', err);
    } finally {
      setIsProcessingFiles(false);
      setUploadStatus(null);
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

  const uploadSingleFileForCard = async (targetId: string, file: File) => {
    try {
      setIsProcessingFiles(true);
      const targetIndex = images.findIndex((img) => img.id === targetId);
      const targetLabel = targetIndex >= 0 ? `Ảnh #${targetIndex + 1}` : 'ảnh';
      setUploadStatus(`Đang dán ảnh vào ${targetLabel} & tải lên Cloudinary...`);

      const oldItem = images.find((item) => item.id === targetId);
      const isReal = oldItem ? oldItem.isRealPhoto : true;
      const finalUrl = await handleUploadImageFile(file, 1, 1, isReal);
      if (finalUrl) {
        if (oldItem?.url && oldItem.url.includes('cloudinary.com') && oldItem.url !== finalUrl) {
          deleteFromCloudinary(oldItem.url);
        }
        const fileNameClean = file.name
          ? file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
          : 'Ảnh chụp';
        handleUpdateItem(targetId, {
          url: finalUrl,
          caption: oldItem?.caption || (fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1)),
        });

        // Trigger brief success notification
        setJustPastedId(targetId);
        setTimeout(() => setJustPastedId(null), 3000);
      }
    } finally {
      setIsProcessingFiles(false);
      setUploadStatus(null);
    }
  };

  const handleCardPaste = (cardId: string, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          setSelectedCardId(cardId);
          uploadSingleFileForCard(cardId, file);
          return;
        }
      }
    }
  };

  // Lắng nghe sự kiện Paste (Ctrl + V) toàn cục
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      // Chỉ can thiệp nếu trong clipboard thực sự có dữ liệu ảnh
      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        // Xác định dòng ảnh mục tiêu:
        // 1. Ưu tiên dòng đang được người dùng bấm chọn (selectedCardId)
        // 2. Nếu chưa chọn hoặc không tìm thấy, lấy dòng rỗng đầu tiên
        // 3. Fallback: dòng đầu tiên
        const targetId =
          selectedCardId && images.some((img) => img.id === selectedCardId)
            ? selectedCardId
            : images.find((img) => !img.url.trim())?.id || images[0]?.id;

        if (targetId && imageFiles.length === 1) {
          uploadSingleFileForCard(targetId, imageFiles[0]);
        } else {
          processMultipleFiles(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images, selectedCardId]);

  // Replace a single photo file
  const handleTriggerReplaceSinglePhoto = (id: string) => {
    targetReplaceIdRef.current = id;
    singleFileInputRef.current?.click();
  };

  const handleSingleFileReplaced = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = targetReplaceIdRef.current;
    if (file && targetId) {
      await uploadSingleFileForCard(targetId, file);
    }
    targetReplaceIdRef.current = null;
    e.target.value = '';
  };

  // Add single empty image field and highlight it immediately
  const handleAddEmptyImage = (isReal = true) => {
    const newItemId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    onChange([
      ...images,
      {
        id: newItemId,
        url: '',
        caption: '',
        isRealPhoto: isReal,
        cameraGear: isReal ? 'Sony A6400 • 18-135mm' : 'Ảnh tham khảo Web',
        exifInfo: isReal ? '35mm • f/4.0 • 1/250s • ISO 100' : 'Sưu tầm & tổng hợp',
      },
    ]);
    setSelectedCardId(newItemId);

    // Auto scroll to the newly created card
    setTimeout(() => {
      const el = document.getElementById(`photo-card-${newItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // Update image item
  const handleUpdateItem = (id: string, updates: Partial<TimelineImageItem>) => {
    onChange(images.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Chuyển đổi giữa Ảnh thực tế (ThucTe) và Ảnh tham khảo (ThamKhao)
  // Nếu ảnh đã lưu trên Cloudinary thì tự động di chuyển sang đúng thư mục
  const handleTogglePhotoType = async (itemId: string, newIsReal: boolean) => {
    const item = images.find((img) => img.id === itemId);
    if (!item) return;

    // Cập nhật trạng thái và thiết bị mặc định
    handleUpdateItem(itemId, {
      isRealPhoto: newIsReal,
      cameraGear: newIsReal ? 'Sony A6400 • 18-135mm' : 'Ảnh tham khảo Web',
      exifInfo: newIsReal ? '35mm • f/4.0 • 1/250s • ISO 100' : 'Sưu tầm & tổng hợp',
    });

    // Nếu ảnh đã được tải lên Cloudinary, kiểm tra xem thư mục có cần di chuyển không
    if (item.url && item.url.includes('cloudinary.com')) {
      const oldFolderPart = newIsReal ? '/ThamKhao/' : '/ThucTe/';
      const targetFolderPart = newIsReal ? 'ThucTe' : 'ThamKhao';

      if (item.url.includes(oldFolderPart)) {
        try {
          setIsProcessingFiles(true);
          setUploadStatus(`Đang chuyển ảnh sang thư mục ${targetFolderPart} trên Cloudinary...`);

          const res = await fetch(item.url);
          const blob = await res.blob();

          const targetFolder = buildCloudinaryTimelineFolder(
            tripSlug || tripTitle,
            tripDate,
            newIsReal
          );

          const newCloudUrl = await uploadToCloudinary(blob, targetFolder);

          // Xóa ảnh cũ ở thư mục cũ
          deleteFromCloudinary(item.url);

          // Cập nhật URL mới vào state
          handleUpdateItem(itemId, {
            isRealPhoto: newIsReal,
            url: newCloudUrl,
          });
        } catch (err) {
          console.error('Lỗi khi di chuyển ảnh Cloudinary giữa ThucTe và ThamKhao:', err);
        } finally {
          setIsProcessingFiles(false);
          setUploadStatus(null);
        }
      }
    }
  };

  // Remove image item (kèm xóa file trên Cloudinary)
  const handleRemoveItem = (id: string) => {
    const itemToRemove = images.find((item) => item.id === id);
    if (itemToRemove?.url && itemToRemove.url.includes('cloudinary.com')) {
      deleteFromCloudinary(itemToRemove.url);
    }

    const updated = images.filter((item) => item.id !== id);
    if (updated.length === 0) {
      const fallbackId = `img-${Date.now()}`;
      onChange([
        {
          id: fallbackId,
          url: '',
          caption: '',
          isRealPhoto: true,
          cameraGear: 'Sony A6400 • 18-135mm',
          exifInfo: '35mm • f/4.0 • 1/250s • ISO 100',
        },
      ]);
      setSelectedCardId(fallbackId);
    } else {
      onChange(updated);
      if (selectedCardId === id) {
        setSelectedCardId(updated[0].id);
      }
    }
  };

  const realCount = images.filter((img) => img.url.trim() && img.isRealPhoto).length;
  const refCount = images.filter((img) => img.url.trim() && !img.isRealPhoto).length;
  const totalCount = images.filter((img) => img.url.trim()).length;
  const selectedCardIndex = images.findIndex((img) => img.id === selectedCardId);

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

      {/* COMPACT & ELEGANT PHOTO TOOLBAR */}
      <div className="bg-[#FAF8F5] border border-[#E6E2DA] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-base font-bold text-[#1C1B18]">
                Bộ Sưu Tập Ảnh ({totalCount} ảnh)
              </h4>
              {realCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-semibold">
                  📷 {realCount} A6400
                </span>
              )}
              {refCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-semibold">
                  🌐 {refCount} Tham khảo
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-[#78756E] mt-0.5">
              Chọn dòng ảnh bên dưới rồi bấm <span className="text-[#B93829] font-bold">Ctrl + V</span> để dán ảnh trực tiếp từ bộ nhớ tạm. Tự động lưu lên Cloudinary.
            </p>
          </div>

          {/* Add Photo Buttons (Thực Tế & Tham Khảo riêng biệt) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddEmptyImage(false)}
              disabled={isProcessingFiles}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Thêm ảnh tham khảo từ web (tự động lưu vào thư mục ThamKhao)"
            >
              <span>🌐</span>
              <span>+ Thêm ảnh tham khảo</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddEmptyImage(true)}
              disabled={isProcessingFiles}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Thêm ảnh chụp thực tế A6400 (tự động lưu vào thư mục ThucTe)"
            >
              <span>📷</span>
              <span>+ Thêm ảnh thực tế</span>
            </button>
          </div>
        </div>

        {/* Dynamic Highlight Target Notice */}
        <div className="space-y-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E6E2DA] shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#1C1B18]">
              <span className="text-sm">🎯</span>
              <span>
                Đích dán phím tắt (Ctrl + V):{' '}
                {selectedCardIndex >= 0 ? (
                  <strong className="text-[#B93829] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Ảnh #{selectedCardIndex + 1}
                  </strong>
                ) : (
                  <span className="text-stone-400 italic">Chưa chọn dòng nào</span>
                )}
              </span>
              <span className="hidden sm:inline text-stone-500 text-[11px]">
                {selectedCardIndex >= 0
                  ? '— Nhấn Ctrl+V để thay đổi ảnh dòng này'
                  : '— Hãy bấm chọn một dòng bên dưới để dán ảnh'}
              </span>
            </div>

            {selectedCardIndex >= 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn sàng dán (Ctrl+V)
              </span>
            )}
          </div>

          {/* Cloudinary Target Folder Preview */}
          {selectedCardIndex >= 0 && (
            <div className="text-[10px] font-mono text-stone-500 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#F0ECE4]">
              <span>📁 Thư mục Cloudinary:</span>
              <span className="text-[#B93829] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E6E2DA] font-semibold">
                {buildCloudinaryTimelineFolder(
                  tripSlug || tripTitle,
                  tripDate,
                  images[selectedCardIndex]?.isRealPhoto !== false
                )}
              </span>
            </div>
          )}
        </div>

        {/* Upload Status / Cloudinary Indicator */}
        {isProcessingFiles && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#B93829] bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl animate-in fade-in duration-150">
            <div className="w-4 h-4 border-2 border-[#B93829] border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-semibold">{uploadStatus || 'Đang tải ảnh lên Cloudinary...'}</span>
          </div>
        )}

        {/* Cloudinary Configuration Warning Banner */}
        {cloudinaryError && !isProcessingFiles && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-sans space-y-1.5 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <span className="text-base">⚠️</span>
              <span>Chưa lưu được lên Cloudinary: {cloudinaryError}</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
              Ảnh tạm thời được lưu dưới dạng Base64 trên trình duyệt. Để ảnh tự động lưu link URL Cloudinary vào Supabase, bạn cần vào <strong>Cloudinary Dashboard → Settings → Upload → Upload presets</strong> và tạo một preset có tên chính xác là <code className="bg-amber-200/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">rodrick_blog</code> với chế độ <strong>Signing Mode = Unsigned</strong>.
            </p>
          </div>
        )}
      </div>

      {/* List of Photo Cards */}
      <div className="space-y-4">
        {images.map((img, index) => {
          const isSelected = selectedCardId === img.id;
          const isJustPasted = justPastedId === img.id;

          return (
            <div
              key={img.id}
              id={`photo-card-${img.id}`}
              onClick={() => setSelectedCardId(img.id)}
              onPaste={(e) => {
                setSelectedCardId(img.id);
                handleCardPaste(img.id, e);
              }}
              className={`rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-2 border-[#B93829] ring-4 ring-[#B93829]/15 shadow-md'
                  : 'bg-white/85 border border-[#E6E2DA] hover:border-[#D0C9BD] hover:bg-white shadow-xs'
              }`}
            >
              {/* PROMINENT TOP RIBBON FOR SELECTED CARD */}
              {isSelected ? (
                <div className="bg-gradient-to-r from-[#B93829] via-[#A83224] to-[#8C271C] text-white px-4 py-2 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <span className="font-mono text-xs font-bold tracking-wide">
                      🎯 ĐANG CHỌN ẢNH #{index + 1}
                    </span>
                    <span className="hidden sm:inline font-mono text-[11px] text-white/90">
                      — Nhấn Ctrl + V ở bất kỳ đâu để thay ảnh dòng này
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold backdrop-blur-xs">
                    {isJustPasted ? '✅ Vừa dán ảnh!' : '⚡ Sẵn sàng Ctrl + V'}
                  </span>
                </div>
              ) : null}

              {/* CARD CONTENT */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Top row: Selection Trigger Button, Source Type Toggle, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0ECE4] pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Explicit Selection Button */}
                    {isSelected ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(img.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#B93829] text-white border border-[#B93829] shadow-xs cursor-default"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B93829]" />
                        </span>
                        <span>Đang chọn dòng này</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(img.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#FAF8F5] hover:bg-rose-50 text-stone-600 hover:text-[#B93829] border border-[#E6E2DA] hover:border-[#B93829]/40 transition-all cursor-pointer shadow-2xs group"
                        title="Bấm để chọn dòng này nhận ảnh khi nhấn Ctrl + V"
                      >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 group-hover:border-[#B93829] flex items-center justify-center transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#B93829]/50 transition-colors" />
                        </span>
                        <span>Chọn dòng này để dán (Ctrl + V)</span>
                      </button>
                    )}

                    <span className="font-mono text-xs text-stone-400 font-semibold">
                      Ảnh #{index + 1}
                    </span>

                    {/* Source Type Toggle */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E6E2DA] ml-1"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCardId(img.id);
                          handleTogglePhotoType(img.id, true);
                        }}
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
                        onClick={() => {
                          setSelectedCardId(img.id);
                          handleTogglePhotoType(img.id, false);
                        }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(img.id);
                    }}
                    className="text-xs font-mono text-rose-600 hover:text-white hover:bg-rose-600 px-2.5 py-1 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Xóa bức ảnh này"
                  >
                    <span>🗑️</span>
                    <span>Xóa ảnh</span>
                  </button>
                </div>

                {/* Middle Row: Photo Preview & Edit details */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Left Thumbnail & Actions */}
                  <div className="w-full sm:w-44 shrink-0 space-y-2">
                    {img.url ? (
                      <div
                        className={`relative h-32 w-full rounded-xl overflow-hidden border bg-[#FAF8F5] group transition-all ${
                          isSelected
                            ? 'border-[#B93829] ring-2 ring-[#B93829]/30 shadow-xs'
                            : 'border-[#E6E2DA]'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.caption || 'Ảnh lịch trình'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {img.url.includes('cloudinary.com') && (
                          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold backdrop-blur-xs flex items-center gap-1 pointer-events-none ${
                                img.url.includes('/ThamKhao/')
                                  ? 'bg-sky-950/85 text-sky-200 border border-sky-400/40'
                                  : 'bg-emerald-950/85 text-emerald-200 border border-emerald-400/40'
                              }`}
                            >
                              <span>☁️</span>
                              <span>{img.url.includes('/ThamKhao/') ? '📁 ThamKhao' : '📁 ThucTe'}</span>
                            </span>

                            {/* Cảnh báo nếu thư mục trên Cloudinary khác với loại ảnh người dùng chọn */}
                            {((!img.isRealPhoto && img.url.includes('/ThucTe/')) ||
                              (img.isRealPhoto && img.url.includes('/ThamKhao/'))) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePhotoType(img.id, img.isRealPhoto);
                                }}
                                className="px-2 py-0.5 rounded-md bg-rose-900/90 hover:bg-rose-800 text-white border border-rose-400 text-[9px] font-mono font-bold shadow-xs cursor-pointer pointer-events-auto flex items-center gap-1"
                                title="Bấm để đồng bộ ảnh sang đúng thư mục trên Cloudinary"
                              >
                                <span>⚠️ Sai thư mục</span>
                                <span>↻ Chuyển ngay</span>
                              </button>
                            )}
                          </div>
                        )}
                        {img.url.startsWith('data:image/') && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-950/85 text-amber-200 border border-amber-400/40 text-[9px] font-mono font-semibold backdrop-blur-xs flex items-center gap-1 z-10 pointer-events-none" title="Ảnh đang là Base64 tạm thời, chưa lưu link Cloudinary">
                            ⚠️ Base64
                          </span>
                        )}

                        {/* Highlight badge on thumbnail when selected */}
                        {isSelected && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-1.5 text-center pointer-events-none">
                            <span className="text-[10px] font-mono text-white font-bold flex items-center justify-center gap-1">
                              <span>🎯</span> Dòng đang chọn (Ctrl+V)
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCardId(img.id);
                              handleTriggerReplaceSinglePhoto(img.id);
                            }}
                            className="bg-white text-[#1C1B18] font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md cursor-pointer hover:bg-rose-50 hover:text-[#B93829]"
                          >
                            ✏️ Chọn ảnh khác
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(img.id);
                          handleTriggerReplaceSinglePhoto(img.id);
                        }}
                        onPaste={(e) => {
                          setSelectedCardId(img.id);
                          handleCardPaste(img.id, e);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          setSelectedCardId(img.id);
                          if (e.dataTransfer.files?.[0]) {
                            uploadSingleFileForCard(img.id, e.dataTransfer.files[0]);
                          }
                        }}
                        tabIndex={0}
                        className={`h-32 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-2.5 cursor-pointer transition-all outline-hidden group select-none ${
                          isSelected
                            ? 'border-[#B93829] bg-rose-50/70 shadow-inner ring-2 ring-[#B93829]/25'
                            : 'border-stone-300 hover:border-[#B93829] bg-[#FAF8F5]/80 hover:bg-rose-50/20'
                        }`}
                        title="Bấm để chọn file hoặc Ctrl + V để dán vào dòng này"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">
                          {img.isRealPhoto ? '📷' : '🌐'}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold mt-1 ${
                            isSelected ? 'text-[#B93829]' : 'text-stone-700'
                          }`}
                        >
                          {isSelected ? 'Nhấn Ctrl + V để dán' : 'Bấm để chọn file'}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md mt-1 ${
                            img.isRealPhoto
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          📁 Vào: {img.isRealPhoto ? 'ThucTe' : 'ThamKhao'}
                        </span>
                      </div>
                    )}

                    {/* If photo is already uploaded, show change photo button */}
                    {img.url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(img.id);
                          handleTriggerReplaceSinglePhoto(img.id);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-[#FAF8F5] hover:bg-[#1C1B18] hover:text-white text-stone-700 border border-[#E6E2DA] transition-colors text-center cursor-pointer text-[10px] font-mono font-semibold"
                      >
                        📁 Đổi ảnh từ máy
                      </button>
                    )}
                  </div>

                  {/* Right Form Inputs */}
                  <div className="flex-1 w-full space-y-3">
                    {/* Caption Input */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-[#78756E] font-semibold">
                        Chú thích ảnh (Caption)
                      </label>
                      <input
                        type="text"
                        value={img.caption}
                        onFocus={() => setSelectedCardId(img.id)}
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
                            onFocus={() => setSelectedCardId(img.id)}
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
                            onFocus={() => setSelectedCardId(img.id)}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelinePhotosManager;
