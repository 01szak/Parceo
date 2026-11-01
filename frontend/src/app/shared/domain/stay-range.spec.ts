import {firstConflict, nightsBetween, nightsLabel, nightsOf, stayHint, stayLabel, withoutOwnStay} from './stay-range';

describe('stay-range', () => {
  it('counts nights between two dates', () => {
    expect(nightsBetween('2026-10-31', '2026-11-03')).toBe(3);
  });

  it('declines the word "noc"', () => {
    expect(nightsLabel(1)).toBe('1 noc');
    expect(nightsLabel(3)).toBe('3 noce');
    expect(nightsLabel(5)).toBe('5 nocy');
    expect(nightsLabel(12)).toBe('12 nocy');
    expect(nightsLabel(22)).toBe('22 noce');
  });

  it('describes the stay with weekdays', () => {
    expect(stayHint('2026-10-31', '2026-11-03')).toBe('3 noce, od soboty do wtorku');
  });

  it('returns no hint for an empty range', () => {
    expect(stayHint('2026-10-31', '2026-10-31')).toBe('');
  });

  it('lists the occupied nights without the departure day', () => {
    expect(nightsOf('2026-10-31', '2026-11-02')).toEqual(['2026-10-31', '2026-11-01']);
  });

  it('finds a stay sharing a night with the wanted range', () => {
    const occupied = [['2026-11-01', '2026-11-02']];
    expect(firstConflict('2026-10-31', '2026-11-03', occupied)).toEqual(occupied[0]);
  });

  it('allows arriving on the day another guest leaves', () => {
    const occupied = [['2026-10-29', '2026-10-30']];
    expect(firstConflict('2026-10-31', '2026-11-03', occupied)).toBeNull();
    expect(firstConflict('2026-10-28', '2026-10-29', occupied)).toBeNull();
  });

  it('drops the edited reservation from the occupancy', () => {
    const occupied = [['2026-10-31', '2026-11-01'], ['2026-11-05']];
    expect(withoutOwnStay(occupied, '2026-10-31', '2026-11-02')).toEqual([['2026-11-05']]);
  });

  it('labels a stay with arrival and departure', () => {
    expect(stayLabel(['2026-11-01', '2026-11-02'])).toBe('01.11 – 03.11');
  });
});
