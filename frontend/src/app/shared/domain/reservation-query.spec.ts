import {filterLabels, hasFilters, NO_FILTERS, reservationCriteria} from './reservation-query';
import {addDays} from './stay-range';

describe('reservationCriteria', () => {
  const today = '2026-11-01';

  it('asks for active reservations in the default view', () => {
    expect(reservationCriteria('active', NO_FILTERS, '', today)).toEqual([
      jasmine.objectContaining({key: 'reservationStatus', operation: 'EQUALS', value: 'ACTIVE'}),
    ]);
  });

  it('sends no criteria for all reservations', () => {
    expect(reservationCriteria('all', NO_FILTERS, '', today)).toEqual([]);
  });

  it('puts the text search first, as the only OR group', () => {
    const criteria = reservationCriteria('unpaid', NO_FILTERS, ' Nowak ', today);
    expect(criteria.slice(0, 3).map(c => [c.joinObject, c.key, c.value, c.joinOperator])).toEqual([
      ['guest', 'firstname', 'Nowak', undefined],
      ['guest', 'lastname', 'Nowak', 'OR'],
      ['guest', 'carRegistration', 'Nowak', 'OR'],
    ]);
    expect(criteria[3]).toEqual(jasmine.objectContaining({key: 'paid', value: 'false', joinOperator: 'AND'}));
  });

  it('maps "late" to an expired, unpaid reservation', () => {
    const criteria = reservationCriteria('all', {...NO_FILTERS, status: 'late'}, '', today);
    expect(criteria.map(c => [c.key, c.value])).toEqual([['reservationStatus', 'EXPIRED'], ['paid', 'false']]);
  });

  it('counts the arrival ranges from today', () => {
    const [lastWeek] = reservationCriteria('all', {...NO_FILTERS, arrival: 'lastWeek'}, '', today);
    expect([lastWeek.value, lastWeek.secondValue]).toEqual(['2026-10-25', today]);
    const [nextWeek] = reservationCriteria('all', {...NO_FILTERS, arrival: 'nextWeek'}, '', today);
    expect([nextWeek.value, nextWeek.secondValue]).toEqual(['2026-11-02', '2026-11-08']);
  });
});

describe('filter helpers', () => {
  it('tells whether any filter is set', () => {
    expect(hasFilters(NO_FILTERS)).toBeFalse();
    expect(hasFilters({...NO_FILTERS, payment: 'paid'})).toBeTrue();
  });

  it('labels the set filters', () => {
    expect(filterLabels({...NO_FILTERS, payment: 'unpaid'}).map(f => f.label)).toEqual(['Płatność: Nieopłacona']);
  });
});

describe('addDays', () => {
  it('moves across a month and a DST change', () => {
    expect(addDays('2026-10-24', 8)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -7)).toBe('2026-10-25');
  });
});
