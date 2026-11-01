import {buildReport, percentChange, topCountries} from './reports';
import {CamperPlaceDto, ReservationDto} from '../../api';

describe('buildReport', () => {
  const kamper = {id: 1, typeName: 'Kamper', price: 100};
  const namiot = {id: 2, typeName: 'Namiot', price: 50};
  const places: CamperPlaceDto[] = [
    {id: 1, index: '1', price: 100, camperPlaceType: kamper},
    {id: 2, index: '2', price: 100, camperPlaceType: kamper},
    {id: 3, index: '3', price: 50, camperPlaceType: namiot},
  ];
  const stay = (id: number, place: number, checkin: string, checkout: string, price: number, paid = true, country = 'PL'): ReservationDto =>
    ({id, checkin, checkout, price, paid, camperPlace: places[place - 1], guest: {id, country}});

  const october = {from: '2026-10-01', to: '2026-11-01'};

  it('counts only the nights and the part of the price inside the period', () => {
    //4 nights, 2 of them in October
    const report = buildReport([stay(1, 1, '2026-10-30', '2026-11-03', 400)], places, october);
    expect(report.nights).toBe(2);
    expect(report.revenue).toBe(200);
  });

  it('spreads the revenue over the days of the period', () => {
    const report = buildReport([stay(1, 1, '2026-10-05', '2026-10-07', 200)], places, october);
    expect(report.bucketUnit).toBe('day');
    expect(report.buckets.length).toBe(31);
    expect(report.buckets[4]).toEqual({start: '2026-10-05', amount: 100});
    expect(report.buckets[6].amount).toBe(0);
  });

  it('groups a year by months', () => {
    const report = buildReport([stay(1, 1, '2026-03-30', '2026-04-02', 300)], places, {from: '2026-01-01', to: '2027-01-01'});
    expect(report.bucketUnit).toBe('month');
    expect(report.buckets.length).toBe(12);
    expect(report.buckets[2]).toEqual({start: '2026-03-01', amount: 200});
    expect(report.buckets[3]).toEqual({start: '2026-04-01', amount: 100});
  });

  it('computes occupancy overall and by type', () => {
    const report = buildReport([stay(1, 3, '2026-10-01', '2026-10-11', 500)], places, october);
    expect(report.occupancy).toBeCloseTo(10 / (3 * 31));
    const tent = report.byType.find(t => t.typeName === 'Namiot')!;
    expect([tent.places, tent.nights, tent.revenue]).toEqual([1, 10, 500]);
    expect(tent.occupancy).toBeCloseTo(10 / 31);
  });

  it('sums unpaid reservations and counts guests by country', () => {
    const report = buildReport([
      stay(1, 1, '2026-10-01', '2026-10-03', 200, false, 'DE'),
      stay(2, 2, '2026-10-01', '2026-10-03', 200, true, 'PL'),
      stay(3, 3, '2026-10-10', '2026-10-12', 100, true, 'PL'),
    ], places, october);
    expect([report.unpaidAmount, report.unpaidReservations]).toEqual([200, 1]);
    expect(report.countries).toEqual([{country: 'PL', guests: 2}, {country: 'DE', guests: 1}]);
  });
});

describe('report helpers', () => {
  it('computes the change against the previous period', () => {
    expect(percentChange(112, 100)).toBe(12);
    expect(percentChange(90, 100)).toBe(-10);
    expect(percentChange(10, 0)).toBeNull();
  });

  it('folds small countries into one slice', () => {
    const countries = [{country: 'PL', guests: 10}, {country: 'DE', guests: 5}, {country: 'NL', guests: 2}, {country: 'CZ', guests: 1}];
    expect(topCountries(countries, 3)).toEqual([{country: 'PL', guests: 10}, {country: 'DE', guests: 5}, {country: null, guests: 3}]);
    expect(topCountries(countries, 5)).toEqual(countries);
  });
});
