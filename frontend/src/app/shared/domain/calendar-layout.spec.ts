import {barTone, calendarBars, calendarDays, startOfWeek} from './calendar-layout';
import {ReservationDto} from '../../api';

describe('calendar layout', () => {
  const today = '2026-11-01';
  const reservation = (checkin: string, checkout: string, extra: Partial<ReservationDto> = {}): ReservationDto =>
    ({id: 1, checkin, checkout, paid: true, reservationStatus: 'COMING', camperPlace: {id: 1, price: 130, camperPlaceType: {typeName: 'Kamper', price: 130}}, guest: {id: 1}, ...extra});

  it('starts the week on Monday', () => {
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26');
    expect(startOfWeek('2026-10-26')).toBe('2026-10-26');
  });

  it('marks weekends, today and week starts', () => {
    const days = calendarDays('2026-10-31', 3, today);
    expect(days.map(d => [d.dayOfMonth, d.weekday, d.weekend, d.today, d.weekStart])).toEqual([
      [31, 'sob', true, false, false],
      [1, 'nd', true, true, false],
      [2, 'pon', false, false, true],
    ]);
  });

  it('draws a stay from the middle of the arrival day to the middle of the departure day', () => {
    const [bar] = calendarBars([reservation('2026-10-27', '2026-10-29')], '2026-10-26', 14, today);
    expect([bar.startHalf, bar.endHalf, bar.cutStart, bar.cutEnd]).toEqual([3, 7, false, false]);
  });

  it('cuts stays reaching outside of the range', () => {
    const [bar] = calendarBars([reservation('2026-10-20', '2026-11-20')], '2026-10-26', 7, today);
    expect([bar.startHalf, bar.endHalf, bar.cutStart, bar.cutEnd]).toEqual([0, 14, true, true]);
  });

  it('leaves out stays outside of the range', () => {
    expect(calendarBars([reservation('2026-12-01', '2026-12-03')], '2026-10-26', 14, today)).toEqual([]);
  });

  it('colors an unpaid guest on site and an unpaid finished stay', () => {
    expect(barTone(reservation('2026-10-30', '2026-11-03', {reservationStatus: 'ACTIVE', paid: false}), today)).toBe('unpaid');
    expect(barTone(reservation('2026-10-20', '2026-10-25', {reservationStatus: 'EXPIRED', paid: false}), today)).toBe('late');
    expect(barTone(reservation('2026-10-20', '2026-10-25', {reservationStatus: 'EXPIRED', paid: true}), today)).toBe('leave');
    expect(barTone(reservation('2026-11-05', '2026-11-07', {paid: false}), today)).toBe('arrive');
  });
});
