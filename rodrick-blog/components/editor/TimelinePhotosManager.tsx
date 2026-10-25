'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  buildCloudinaryTimelineFolder,
  slugifyFolderName,
} from '@/lib/cloudinary';
import { PhotoFrame } from '@/components/ui/PhotoFrame';

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

  // Ô nhập cùng kiểu với hộp sửa mốc, nhưng nền giấy vì thẻ ảnh đã là nền đá
  const fieldClass =
    'w-full bg-paper border border-transparent px-3 py-2 text-small text-ink outline-none transition-colors duration-200 placeholder:text-muted/60 hover:border-surface focus:border-ink focus:bg-paper';

  return (
    <div className="space-y-6">
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

      {/* Thanh công cụ: đếm ảnh theo loại, thêm ảnh */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-lead leading-none tabular">{totalCount} ảnh</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted tabular">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="w-2.5 h-2.5 bg-accent" />
              {realCount} thực tế
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="w-2.5 h-2.5 bg-(--note-ref-tag)" />
              {refCount} tham khảo
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => multiFileInputRef.current?.click()}
            disabled={isProcessingFiles}
            className="min-h-10 px-4 text-small font-semibold bg-ground hover:bg-surface cursor-pointer transition-colors duration-200 disabled:opacity-50"
          >
            Tải nhiều ảnh
          </button>
          <button
            type="button"
            onClick={() => handleAddEmptyImage(false)}
            disabled={isProcessingFiles}
            className="min-h-10 px-4 text-small font-semibold bg-(--note-ref-tag) text-ink hover:brightness-95 cursor-pointer transition-[filter] duration-200 disabled:opacity-50"
          >
            + Ảnh tham khảo
          </button>
          <button
            type="button"
            onClick={() => handleAddEmptyImage(true)}
            disabled={isProcessingFiles}
            className="min-h-10 px-4 text-small font-semibold bg-accent text-accent-ink hover:bg-accent-deep cursor-pointer transition-colors duration-200 disabled:opacity-50"
          >
            + Ảnh thực tế
          </button>
        </div>
      </div>

      <p className="text-small text-muted">
        Chọn một ô ảnh rồi bấm Ctrl + V để dán ảnh từ clipboard, hoặc kéo thả file vào ô trống.
        {selectedCardIndex >= 0 && <> Đang chọn: <span className="text-ink font-semibold">Ảnh {selectedCardIndex + 1}</span>.</>}
      </p>

      {/* Trạng thái tải lên và lỗi Cloudinary */}
      {isProcessingFiles && (
        <div className="flex items-center gap-3 px-4 py-3 bg-ink text-paper text-small" aria-live="polite">
          <span aria-hidden="true" className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          {uploadStatus || 'Đang tải ảnh...'}
        </div>
      )}
      {cloudinaryError && !isProcessingFiles && (
        <div className="px-4 py-3 bg-(--note-ref) text-small">
          {cloudinaryError}. Ảnh đang được lưu tạm dạng Base64.
        </div>
      )}

      {/* Danh sách ảnh */}
      <div className="space-y-4">
        {images.map((img, index) => {
          const isSelected = selectedCardId === img.id;
          const isJustPasted = justPastedId === img.id;
          const kind = img.isRealPhoto ? 'real' : 'ref';
          const wrongFolder =
            img.url.includes('cloudinary.com') &&
            ((!img.isRealPhoto && img.url.includes('/ThucTe/')) || (img.isRealPhoto && img.url.includes('/ThamKhao/')));

          return (
            <div
              key={img.id}
              id={`photo-card-${img.id}`}
              onClick={() => setSelectedCardId(img.id)}
              onPaste={(e) => {
                setSelectedCardId(img.id);
                handleCardPaste(img.id, e);
              }}
              className={`grid gap-5 sm:grid-cols-[13rem_minmax(0,1fr)] p-4 sm:p-5 cursor-pointer transition-colors duration-200 ${
                isSelected ? 'bg-ground outline-2 outline-accent -outline-offset-2' : 'bg-ground/50 hover:bg-ground'
              }`}
            >
              {/* Ảnh: khung đúng loại như trên trang, hoặc ô trống để chọn/dán/thả */}
              <div className="space-y-2">
                {img.url ? (
                  <PhotoFrame kind={kind} small>
                    <span className="relative block group">
                      <img src={img.url} alt={img.caption || 'Ảnh lịch trình'} className="block w-full aspect-4/3 object-cover bg-surface" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(img.id);
                          handleTriggerReplaceSinglePhoto(img.id);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-ink/50 text-paper text-small font-semibold opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer"
                      >
                        Đổi ảnh
                      </button>
                    </span>
                  </PhotoFrame>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCardId(img.id);
                      handleTriggerReplaceSinglePhoto(img.id);
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
                    title="Bấm để chọn file hoặc Ctrl + V để dán"
                    className={`aspect-4/3 flex flex-col items-center justify-center gap-1 p-3 text-center border-2 border-dashed cursor-pointer select-none outline-none transition-colors duration-200 ${
                      isSelected ? 'border-accent bg-paper' : 'border-surface hover:border-muted bg-paper/60'
                    }`}
                  >
                    <span className="text-lead leading-none text-muted">+</span>
                    <span className={`text-small font-semibold ${isSelected ? 'text-accent' : ''}`}>
                      {isSelected ? 'Ctrl + V để dán' : 'Chọn ảnh'}
                    </span>
                    <span className="text-small text-muted">hoặc kéo thả vào đây</span>
                  </div>
                )}

                {/* Trạng thái lưu trữ: thư mục Cloudinary, Base64, vừa dán */}
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted">
                  {img.url.includes('cloudinary.com') && (
                    <span>Cloudinary · {img.url.includes('/ThamKhao/') ? 'ThamKhao' : 'ThucTe'}</span>
                  )}
                  {img.url.startsWith('data:image/') && <span className="text-accent">Base64 tạm, chưa lên Cloudinary</span>}
                  {isJustPasted && <span className="text-ink font-semibold">Đã dán ảnh</span>}
                </p>
                {wrongFolder && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePhotoType(img.id, img.isRealPhoto);
                    }}
                    className="text-small font-semibold text-accent underline underline-offset-4 cursor-pointer"
                    title="Chuyển ảnh sang đúng thư mục trên Cloudinary"
                  >
                    Sai thư mục, chuyển ngay
                  </button>
                )}
              </div>

              {/* Thông tin ảnh */}
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-small font-semibold tabular">Ảnh {index + 1}</span>
                    <div role="group" aria-label="Loại ảnh" onClick={(e) => e.stopPropagation()} className="flex">
                      <button
                        type="button"
                        aria-pressed={img.isRealPhoto}
                        onClick={() => {
                          setSelectedCardId(img.id);
                          if (!img.isRealPhoto) handleTogglePhotoType(img.id, true);
                        }}
                        className={`min-h-9 px-3 text-small cursor-pointer transition-colors duration-200 ${
                          img.isRealPhoto ? 'bg-accent text-accent-ink font-semibold' : 'bg-paper hover:bg-surface'
                        }`}
                      >
                        Thực tế
                      </button>
                      <button
                        type="button"
                        aria-pressed={!img.isRealPhoto}
                        onClick={() => {
                          setSelectedCardId(img.id);
                          if (img.isRealPhoto) handleTogglePhotoType(img.id, false);
                        }}
                        className={`min-h-9 px-3 text-small cursor-pointer transition-colors duration-200 ${
                          !img.isRealPhoto ? 'bg-(--note-ref-tag) text-ink font-semibold' : 'bg-paper hover:bg-surface'
                        }`}
                      >
                        Tham khảo
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(img.id);
                    }}
                    className="text-small font-semibold text-muted hover:text-accent underline underline-offset-4 cursor-pointer"
                    title="Xóa bức ảnh này"
                  >
                    Xóa ảnh
                  </button>
                </div>

                <label className="block space-y-1.5">
                  <span className="block text-small font-semibold">Chú thích</span>
                  <input
                    type="text"
                    value={img.caption}
                    onFocus={() => setSelectedCardId(img.id)}
                    onChange={(e) => handleUpdateItem(img.id, { caption: e.target.value })}
                    placeholder="VD: Cổng Torii trong làn sương sớm"
                    className={fieldClass}
                  />
                </label>

                {img.isRealPhoto && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="block text-small font-semibold">Máy ảnh và ống kính</span>
                      <input
                        type="text"
                        value={img.cameraGear}
                        onFocus={() => setSelectedCardId(img.id)}
                        onChange={(e) => handleUpdateItem(img.id, { cameraGear: e.target.value })}
                        placeholder="Sony A6400 • 18-135mm"
                        className={fieldClass}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="block text-small font-semibold">Thông số EXIF</span>
                      <input
                        type="text"
                        value={img.exifInfo}
                        onFocus={() => setSelectedCardId(img.id)}
                        onChange={(e) => handleUpdateItem(img.id, { exifInfo: e.target.value })}
                        placeholder="35mm • f/4.0 • 1/250s • ISO 100"
                        className={`${fieldClass} tabular`}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelinePhotosManager;
