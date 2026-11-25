import React, { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FolderInput, ListFilter, Trash2, X } from 'lucide-react-native';
import { Dialog, IconButton, offlineBanner, Toast } from '../../../shared/ui';
import { iconSize, iconStroke, layout, useTheme } from '../../../theme';
import { deletePhotos, movePhotos } from '../api/photos';
import { FilterSheet } from '../components/FilterSheet';
import { MoveSheet } from '../components/MoveSheet';
import { PhotoGrid } from '../components/PhotoGrid';
import { PhotoViewer } from '../components/PhotoViewer';
import { Collection, Photo, PhotoFilter } from '../types';
import { usePhotoPages } from './usePhotoPages';

const icon = (Icon: typeof X) => (c: string) =>
  <Icon color={c} size={iconSize.control} strokeWidth={iconStroke.normal} strokeLinecap="round" />;
const renderFilter = icon(ListFilter);
const renderDelete = icon(Trash2);
const renderMove = icon(FolderInput);
const renderClose = icon(X);

const NO_SELECTION: ReadonlySet<number> = new Set();

type ToastState = { message: string; kind: 'success' | 'error' } | null;

/**
 * Chọn nhiều ảnh: nhấn giữ một ảnh để bắt đầu, chạm để chọn/bỏ chọn, bỏ hết là thoát.
 * Nút Back của Android cũng thoát chế độ chọn thay vì rời màn.
 */
function useSelection(enabled: boolean) {
  const [ids, setIds] = useState<ReadonlySet<number>>(NO_SELECTION);
  const selecting = enabled && ids.size > 0;

  const toggle = useCallback((id: number) => {
    setIds(cur => {
      const next = new Set(cur);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }, []);
  const clear = useCallback(() => setIds(NO_SELECTION), []);

  useFocusEffect(
    useCallback(() => {
      if (!selecting) {
        return;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        clear();
        return true;
      });
      return () => sub.remove();
    }, [selecting, clear]),
  );

  return { ids, selecting, toggle, clear };
}

type Options = {
  /** Chỉ ảnh của bộ sưu tập này; bỏ trống là tất cả ảnh. */
  collectionId?: number;
  filter: PhotoFilter;
  onFilterChange: (filter: PhotoFilter) => void;
  /** false: lưới đang ẩn (ví dụ tab Ảnh đang ở chế độ Bộ sưu tập), không hiện nút, không chọn. */
  active?: boolean;
  emptyMessage: string;
  /** Phần trên lưới, cuộn cùng lưới. */
  gridHeader?: React.ReactElement;
  /** Gọi sau khi xoá hoặc chuyển ảnh xong (ví dụ để tải lại số ảnh của các bộ sưu tập). */
  onChanged?: () => void;
};

/**
 * Lưới ảnh kèm lọc theo loại, chọn nhiều và xoá; dùng chung cho tab Ảnh và màn bộ sưu tập.
 * Trả các phần để màn tự đặt vào Screen: nút header, tiêu đề khi đang chọn, lưới, lớp nổi.
 */
export function usePhotoBrowser({
  collectionId,
  filter,
  onFilterChange,
  active = true,
  emptyMessage,
  gridHeader,
  onChanged,
}: Options) {
  const { colors } = useTheme();
  const pages = usePhotoPages(collectionId, filter);
  const selection = useSelection(active);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  // Đang xoá hoặc đang chuyển ảnh: khoá các nút, không cho chọn thêm.
  const [working, setWorking] = useState<'delete' | 'move' | null>(null);
  const deleting = working !== null;
  const [toast, setToast] = useState<ToastState>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Mất mạng (đang xem bản lưu): không cho chọn để xoá.
  const readOnly = pages.cachedAt !== null;
  const count = selection.ids.size;

  const setFilter = (f: PhotoFilter) => {
    // Lưới đổi theo bộ lọc nên bỏ lựa chọn cũ.
    selection.clear();
    onFilterChange(f);
  };

  const onPhotoPress = (index: number) => {
    const photo = pages.photos[index];
    if (!photo) {
      return;
    }
    if (selection.selecting) {
      selection.toggle(photo.id);
    } else {
      setViewerIndex(index);
    }
  };

  const remove = async () => {
    setConfirmOpen(false);
    const picked: Photo[] = pages.photos.filter(p => selection.ids.has(p.id));
    setWorking('delete');
    try {
      const { cdnFailed } = await deletePhotos(picked);
      pages.removeLocal(picked.map(p => p.id));
      selection.clear();
      onChanged?.();
      setToast(
        cdnFailed
          ? {
              kind: 'error',
              message: `Đã xoá ${picked.length} ảnh, ${cdnFailed} file chưa xoá được trên Cloudinary`,
            }
          : { kind: 'success', message: `Đã xoá ${picked.length} ảnh` },
      );
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Không xoá được ảnh.' });
    } finally {
      setWorking(null);
    }
  };

  const move = async (target: Collection) => {
    setMoveOpen(false);
    const ids = pages.photos.filter(p => selection.ids.has(p.id)).map(p => p.id);
    setWorking('move');
    try {
      await movePhotos(ids, target.id);
      // Đang xem một bộ sưu tập: ảnh đã sang bộ khác nên bỏ khỏi lưới này.
      if (collectionId !== undefined) {
        pages.removeLocal(ids);
      }
      selection.clear();
      onChanged?.();
      setToast({ kind: 'success', message: `Đã chuyển ${ids.length} ảnh sang ${target.title}` });
    } catch (e) {
      setToast({ kind: 'error', message: e instanceof Error ? e.message : 'Không chuyển được ảnh.' });
    } finally {
      setWorking(null);
    }
  };

  const filterButton = (
    <IconButton
      accessibilityLabel="Lọc theo loại ảnh"
      variant="ghost"
      // Chấm báo: đang lọc riêng một loại.
      badge={filter !== 'all'}
      disabled={deleting}
      onPress={() => setFilterOpen(true)}
      icon={renderFilter}
    />
  );

  let headerRight: React.ReactNode;
  if (!active) {
    headerRight = undefined;
  } else if (selection.selecting) {
    headerRight = (
      <View style={styles.actions}>
        {filterButton}
        {working === 'move' ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.text} />
          </View>
        ) : (
          <IconButton
            accessibilityLabel={`Chuyển ${count} ảnh đã chọn sang bộ sưu tập khác`}
            variant="ghost"
            disabled={deleting}
            onPress={() => setMoveOpen(true)}
            icon={renderMove}
          />
        )}
        {working === 'delete' ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.error} />
          </View>
        ) : (
          <IconButton
            disabled={deleting}
            accessibilityLabel={`Xoá ${count} ảnh đã chọn`}
            // Chỉ icon, không nền; giữ màu lỗi để biết là nút phá huỷ.
            variant="ghost"
            onPress={() => setConfirmOpen(true)}
            icon={() => renderDelete(colors.error)}
          />
        )}
      </View>
    );
  } else {
    headerRight = filterButton;
  }

  return {
    selecting: selection.selecting,
    /** Tiêu đề thay thế khi đang chọn ("Đã chọn N"); null thì màn dùng tiêu đề của mình. */
    selectionTitle: selection.selecting ? `Đã chọn ${count}` : null,
    /** Nút bỏ chọn, đặt ở headerLeft khi đang chọn. */
    clearButton: selection.selecting ? (
      <IconButton
        accessibilityLabel="Bỏ chọn"
        variant="ghost"
        disabled={deleting}
        onPress={selection.clear}
        icon={renderClose}
      />
    ) : null,
    clearSelection: selection.clear,
    /** Hiện toast chung của màn (ví dụ báo đã lưu bộ sưu tập). */
    notify: setToast,
    headerRight,
    banner: active ? offlineBanner(pages.cachedAt) : undefined,
    grid: (
      <PhotoGrid
        photos={pages.photos}
        loading={pages.loading}
        loadingMore={pages.loadingMore}
        error={pages.error}
        onRetry={pages.reload}
        onEndReached={pages.loadMore}
        onPhotoPress={onPhotoPress}
        onPhotoLongPress={readOnly || deleting ? undefined : p => selection.toggle(p.id)}
        selecting={selection.selecting}
        selectedIds={selection.ids}
        tagReference={filter === 'all'}
        header={gridHeader}
        emptyMessage={
          filter === 'all'
            ? emptyMessage
            : `Chưa có ${filter === 'real' ? 'ảnh thực tế' : 'ảnh tham khảo'} nào.`
        }
      />
    ),
    /** Màn xem ảnh, bảng lọc và hộp thoại xoá: đặt trong Screen. */
    overlays: (
      <>
        <PhotoViewer
          photos={pages.photos}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onEndReached={pages.loadMore}
          onShareError={message => setToast({ kind: 'error', message })}
        />
        <FilterSheet
          visible={filterOpen}
          value={filter}
          onChange={setFilter}
          onClose={() => setFilterOpen(false)}
        />
        <MoveSheet
          visible={moveOpen}
          count={count}
          currentId={collectionId}
          onPick={move}
          onClose={() => setMoveOpen(false)}
        />
        <Dialog
          visible={confirmOpen}
          title={`Xoá ${count} ảnh?`}
          description="Ảnh bị xoá khỏi blog và khỏi Cloudinary, không khôi phục được."
          confirmLabel="Xoá"
          destructive
          onCancel={() => setConfirmOpen(false)}
          onConfirm={remove}
        />
      </>
    ),
    /** Đặt ngoài Screen (cùng cấp) để nổi trên footer. */
    toast: (
      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        kind={toast?.kind}
        onDismiss={() => setToast(null)}
      />
    ),
  };
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 4 },
  busy: {
    width: layout.minTouch,
    height: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
