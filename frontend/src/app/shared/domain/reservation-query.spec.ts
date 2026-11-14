import {filterLabels, hasFilters, NO_FILTERS, placeTypeFilterGroup, reservationCriteria} from './reservation-query';
import {addDays} from './stay-range';

describe('reservationCriteria', () => {
  const today = '2026-11-01';

  it('asks for active reservations in the default view', () => {
    expect(reservationCriteria('active', NO_FILTERS, '', today)).toEqual([
      jasmine.objectContaining({object: {key: 'reservationStatus'}, operation: 'EQUALS', value: 'ACTIVE'}),
    ]);
  });

  it('sends no criteria for all reservations', () => {
    expect(reservationCriteria('all', NO_FILTERS, '', today)).toEqual([]);
  });

  it('puts the text search first, as the only OR group', () => {
    const criteria = reservationCriteria('unpaid', NO_FILTERS, ' Nowak ', today);
    expect(criteria.slice(0, 3).map(c => [c.object, c.value, c.joinOperator])).toEqual([
      [{key: 'guest', inner: {key: 'firstname'}}, 'Nowak', undefined],
      [{key: 'guest', inner: {key: 'lastname'}}, 'Nowak', 'OR'],
      [{key: 'guest', inner: {key: 'carRegistration'}}, 'Nowak', 'OR'],
    ]);
    expect(criteria[3]).toEqual(jasmine.objectContaining({object: {key: 'paid'}, value: 'false', joinOperator: 'AND'}));
  });

  it('maps "late" to an expired, unpaid reservation', () => {
    const criteria = reservationCriteria('all', {...NO_FILTERS, status: 'late'}, '', today);
    expect(criteria.map(c => [c.object.key, c.value])).toEqual([['reservationStatus', 'EXPIRED'], ['paid', 'false']]);
  });

  it('counts the arrival ranges from today', () => {
    const [lastWeek] = reservationCriteria('all', {...NO_FILTERS, arrival: 'lastWeek'}, '', today);
    expect([lastWeek.value, lastWeek.secondValue]).toEqual(['2026-10-25', today]);
    const [nextWeek] = reservationCriteria('all', {...NO_FILTERS, arrival: 'nextWeek'}, '', today);
    expect([nextWeek.value, nextWeek.secondValue]).toEqual(['2026-11-02', '2026-11-08']);
  });
});

describe('place type filter', () => {
  it('filters through the camper place by the type id', () => {
    const [criterion] = reservationCriteria('all', {...NO_FILTERS, placeType: '7'}, '', '2026-11-01');
    expect(criterion).toEqual({
      object: {key: 'camperPlace', inner: {key: 'camperPlaceType', inner: {key: 'id'}}},
      operation: 'EQUALS', value: '7', joinOperator: 'AND',
    });
  });

  it('lists the types as options after "Dowolny"', () => {
    const group = placeTypeFilterGroup([{id: 3, typeName: 'Kamper'}, {typeName: 'Bez id'}]);
    expect(group.options).toEqual([{value: 'any', label: 'Dowolny'}, {value: '3', label: 'Kamper'}]);
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
