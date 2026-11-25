import {
  addLocalDocument,
  listLocalDocuments,
  removeLocalDocument,
  updateLocalDocumentType,
} from '../src/shared/api/localDocuments';

const base = { name: 'Phiếu đặt bàn', type: 'BOOKING' as const, uri: 'file:///a.pdf', mimeType: 'application/pdf' };

describe('kho giấy tờ cục bộ', () => {
  it('thêm, liệt kê theo mốc và xoá', async () => {
    const a = await addLocalDocument({ ...base, eventId: 1 });
    await addLocalDocument({ ...base, eventId: 2, name: 'Vé khác' });
    const b = await addLocalDocument({ ...base, eventId: 1, name: 'Voucher' });

    const forOne = await listLocalDocuments(1);
    expect(forOne.map(d => d.name)).toEqual(['Phiếu đặt bàn', 'Voucher']);
    expect(a.id).not.toBe(b.id);

    await removeLocalDocument(a.id);
    expect((await listLocalDocuments(1)).map(d => d.id)).toEqual([b.id]);
    expect(await listLocalDocuments(2)).toHaveLength(1);
  });

  it('mốc chưa có giấy tờ trả mảng rỗng', async () => {
    expect(await listLocalDocuments(999)).toEqual([]);
  });
});

describe('sửa loại giấy tờ', () => {
  it('chỉ đổi loại, giữ nguyên tên và tệp', async () => {
    const d = await addLocalDocument({ ...base, eventId: 50 });
    await updateLocalDocumentType(d.id, 'FLIGHT');
    const [after] = await listLocalDocuments(50);
    expect(after).toMatchObject({ id: d.id, type: 'FLIGHT', name: base.name, uri: base.uri });
  });
});
