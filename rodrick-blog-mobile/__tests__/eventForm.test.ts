import { buildEventPatch, dayNumberOf, formFromEvent, isoToVn, normalizeTime, validateEventForm, vnToIso } from '../src/features/trips/eventForm';
import { DetailEvent } from '../src/features/trips/types';

const event: DetailEvent = {
  id: 1,
  day_number: 3,
  trip_date: '2026-12-14',
  start_time: '12:40:00',
  end_time: '13:30:00',
  end_day_offset: 0,
  time_slot: '12:40 - 13:30',
  location_name: 'Ăn trưa',
  city: 'Kyoto',
  category_tag: 'RESTAURANT',
  notes: 'a\n- b',
  event_maps: [],
  images: [],
  documents: [],
};

describe('ngày giờ', () => {
  it('đổi qua lại dd/mm/yyyy và yyyy-mm-dd', () => {
    expect(isoToVn('2026-12-14')).toBe('14/12/2026');
    expect(vnToIso('14/12/2026')).toBe('2026-12-14');
    expect(vnToIso('4/1/2027')).toBe('2027-01-04');
  });

  it('từ chối ngày không tồn tại', () => {
    expect(vnToIso('31/02/2026')).toBeNull();
    expect(vnToIso('abc')).toBeNull();
  });

  it('chuẩn hoá giờ', () => {
    expect(normalizeTime('8:30')).toBe('08:30');
    expect(normalizeTime('24:00')).toBeNull();
    expect(normalizeTime('12:60')).toBeNull();
  });
});

describe('validateEventForm', () => {
  it('form từ mốc có sẵn hợp lệ', () => {
    expect(validateEventForm(formFromEvent(event))).toEqual({});
  });

  it('báo lỗi từng trường', () => {
    const f = { ...formFromEvent(event), locationName: ' ', startTime: '', endTime: '9', date: '1/1' };
    expect(Object.keys(validateEventForm(f)).sort()).toEqual(['date', 'endTime', 'locationName', 'startTime']);
  });

  it('giờ kết thúc để trống là hợp lệ', () => {
    expect(validateEventForm({ ...formFromEvent(event), endTime: '' })).toEqual({});
  });
});

describe('buildEventPatch', () => {
  it('giữ category_tag gốc khi loại mốc không đổi (RESTAURANT vẫn là Ẩm thực)', () => {
    const p = buildEventPatch(formFromEvent(event), event, ['2026-12-12']);
    expect(p.category_tag).toBe('RESTAURANT');
    expect(p.start_time).toBe('12:40:00');
    expect(p.end_time).toBe('13:30:00');
    expect(p.end_day_offset).toBe(0);
    expect(p.time_slot).toBe('12:40 - 13:30');
    expect(p.day_number).toBe(2);
  });

  it('đổi loại mốc thì dùng mã chuẩn', () => {
    const p = buildEventPatch({ ...formFromEvent(event), category: 'sight' }, event, []);
    expect(p.category_tag).toBe('SIGHTSEEING');
  });

  it('kết thúc sớm hơn bắt đầu là qua đêm', () => {
    const f = { ...formFromEvent(event), startTime: '20:00', endTime: '08:30' };
    const p = buildEventPatch(f, event, []);
    expect(p.end_day_offset).toBe(1);
    expect(p.time_slot).toBe('20:00 (14/12) - 08:30 (15/12)');
  });

  it('ghi chú trống thành null và bỏ khoảng trắng cuối', () => {
    expect(buildEventPatch({ ...formFromEvent(event), notes: '  \n' }, event, []).notes).toBeNull();
    expect(buildEventPatch({ ...formFromEvent(event), notes: 'x\n- ' }, event, []).notes).toBe('x\n-');
  });

  it('không có giờ kết thúc', () => {
    const p = buildEventPatch({ ...formFromEvent(event), endTime: '' }, event, []);
    expect(p.end_time).toBeNull();
    expect(p.time_slot).toBe('12:40');
  });
});

describe('dayNumberOf', () => {
  it('đếm theo thứ tự ngày có mốc', () => {
    expect(dayNumberOf('2026-12-14', ['2026-12-12', '2026-12-13'])).toBe(3);
    expect(dayNumberOf('2026-12-11', ['2026-12-12'])).toBe(1);
  });
});
