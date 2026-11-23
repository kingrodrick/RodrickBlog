import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { viewDocument } from '@react-native-documents/viewer';
import { LocalDocument } from '../../shared/api/localDocuments';

export type PickedDocument = { uri: string; name: string; mimeType: string | null };

/** Mở bộ chọn tệp hệ thống (PDF hoặc ảnh). Trả null khi người dùng huỷ. */
export async function pickDocument(): Promise<PickedDocument | null> {
  try {
    const [file] = await pick({ type: [types.pdf, types.images], allowMultiSelection: false });
    return { uri: file.uri, name: file.name ?? 'giay-to', mimeType: file.type ?? null };
  } catch (e) {
    if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    throw e;
  }
}

/** Tên tệp an toàn để lưu trong thư mục riêng của app. */
export const safeFileName = (name: string) =>
  `${Date.now()}-${name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_')}`;

/** Sao chép tệp đã chọn vào thư mục riêng của app (Android thu hồi quyền đọc đường dẫn của bộ chọn), trả file://. */
export async function copyIntoApp(doc: PickedDocument): Promise<string> {
  const [res] = await keepLocalCopy({
    files: [{ uri: doc.uri, fileName: safeFileName(doc.name) }],
    destination: 'documentDirectory',
  });
  if (res.status !== 'success') {
    throw new Error(`Không lưu được tệp: ${res.copyError}`);
  }
  return res.localUri;
}

/** Mở giấy tờ bằng trình xem của hệ thống. */
export function openDocument(doc: LocalDocument): Promise<null> {
  return viewDocument({ uri: doc.uri, mimeType: doc.mimeType ?? undefined, headerTitle: doc.name });
}

export const isPdfDocument = (doc: Pick<LocalDocument, 'uri' | 'mimeType'>) =>
  doc.mimeType === 'application/pdf' || /\.pdf$/i.test(doc.uri);

/** Tên hiển thị mặc định từ tên tệp: bỏ phần mở rộng. */
export const defaultDocName = (fileName: string) => fileName.replace(/\.[A-Za-z0-9]{1,5}$/, '');
