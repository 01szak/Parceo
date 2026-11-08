import {availabilityPerDay, freeNightsInARow, freePlaceIdsOn, occupiesNight, Stay} from './occupancy';
import {arrivalsSentence, unpaidSentence} from './today-summary';

describe('occupancy', () => {
  const stays: Stay[] = [
    {camperPlaceId: 1, checkin: '2026-11-01', checkout: '2026-11-03'},
    {camperPlaceId: 2, checkin: '2026-10-30', checkout: '2026-11-01'},
  ];

  it('takes the nights from arrival up to the night before departure', () => {
    expect(occupiesNight(stays[0], '2026-11-01')).toBeTrue();
    expect(occupiesNight(stays[0], '2026-11-02')).toBeTrue();
    expect(occupiesNight(stays[0], '2026-11-03')).toBeFalse();
  });

  it('frees a place on the day the guest leaves', () => {
    expect(freePlaceIdsOn([1, 2, 3], stays, '2026-11-01')).toEqual([2, 3]);
  });

  it('lists free places night by night', () => {
    expect(availabilityPerDay([1, 2], stays, '2026-10-31', 3).map(d => [d.date, d.freePlaceIds])).toEqual([
      ['2026-10-31', [1]],
      ['2026-11-01', [2]],
      ['2026-11-02', [2]],
    ]);
  });

  it('counts free nights in a row until the next stay', () => {
    expect(freeNightsInARow(1, stays, '2026-10-29', 14)).toBe(3);
    expect(freeNightsInARow(3, stays, '2026-10-29', 14)).toBe(14);
    expect(freeNightsInARow(1, stays, '2026-11-01', 14)).toBe(0);
  });
});

describe('today summary', () => {
  it('describes arrivals and departures', () => {
    expect(arrivalsSentence(4, 3)).toBe('Dziś przyjeżdża 4 gości i wyjeżdża 3.');
    expect(arrivalsSentence(1, 0)).toBe('Dziś przyjeżdża 1 gość.');
    expect(arrivalsSentence(0, 2)).toBe('Dziś wyjeżdża 2 gości.');
    expect(arrivalsSentence(0, 0)).toBe('Dziś nikt nie przyjeżdża ani nie wyjeżdża.');
  });

  it('declines the unpaid reservations', () => {
    expect(unpaidSentence(1)).toBe('1 rezerwacja czeka na zapłatę.');
    expect(unpaidSentence(2)).toBe('2 rezerwacje czekają na zapłatę.');
    expect(unpaidSentence(5)).toBe('5 rezerwacji czeka na zapłatę.');
    expect(unpaidSentence(0)).toBe('Wszystkie rezerwacje są opłacone.');
  });
});
