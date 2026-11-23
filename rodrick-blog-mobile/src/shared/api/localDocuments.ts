import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Giấy tờ chỉ lưu trên điện thoại (vì bảo mật): tệp được sao chép vào thư mục riêng của app,
 * thông tin nằm ở AsyncStorage. Không tải lên Cloudinary hay Supabase.
 */
export type LocalDocType = 'FLIGHT' | 'TRANSPORT' | 'BOOKING';

export type LocalDocument = {
  id: string;
  eventId: number;
  name: string;
  type: LocalDocType;
  /** file:// trong thư mục riêng của app. */
  uri: string;
  mimeType: string | null;
  addedAt: string;
};

const KEY = 'documents.v1';

async function readAll(): Promise<LocalDocument[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as LocalDocument[]) : [];
  } catch {
    return [];
  }
}

const writeAll = (list: LocalDocument[]) => AsyncStorage.setItem(KEY, JSON.stringify(list));

export async function listLocalDocuments(eventId: number): Promise<LocalDocument[]> {
  return (await readAll())
    .filter(d => d.eventId === eventId)
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

export async function addLocalDocument(doc: Omit<LocalDocument, 'id' | 'addedAt'>): Promise<LocalDocument> {
  const all = await readAll();
  const now = Date.now();
  const saved: LocalDocument = { ...doc, id: `${now}-${all.length}`, addedAt: new Date(now).toISOString() };
  await writeAll([...all, saved]);
  return saved;
}

export async function removeLocalDocument(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter(d => d.id !== id));
}
